package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type PickPathOptions struct {
	DefaultPath string `json:"defaultPath"`
}

type backendEnvelope struct {
	ID      string          `json:"id,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   string          `json:"error,omitempty"`
	Event   string          `json:"event,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type backendRequest struct {
	ID     string `json:"id"`
	Method string `json:"method"`
	Args   []any  `json:"args,omitempty"`
}

type App struct {
	ctx context.Context

	backendCmd   *exec.Cmd
	backendIn    io.WriteCloser
	backendStart sync.Once

	pendingMu sync.Mutex
	pending   map[string]chan backendEnvelope

	writeMu   sync.Mutex
	requestID uint64
}

func NewApp() *App {
	return &App{
		pending: make(map[string]chan backendEnvelope),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.ensureBackend(); err != nil {
		runtime.LogError(ctx, fmt.Sprintf("Failed to start Node backend: %v", err))
	}
}

func (a *App) shutdown(ctx context.Context) {
	a.stopBackend()
}

func (a *App) ensureBackend() error {
	if a.backendCmd != nil && a.backendCmd.Process != nil {
		return nil
	}

	nodePath, err := exec.LookPath("node")
	if err != nil {
		return errors.New("Node.js executable was not found in PATH")
	}

	projectRoot, err := os.Getwd()
	if err != nil {
		return err
	}

	repoRoot := filepath.Clean(filepath.Join(projectRoot, ".."))
	scriptPath := filepath.Join(repoRoot, "backend", "node", "dayz-backend.cjs")
	cmd := exec.Command(nodePath, scriptPath)
	cmd.Dir = repoRoot

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}

	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return err
	}

	a.backendCmd = cmd
	a.backendIn = stdin

	go a.readBackendOutput(stdout)
	go func() {
		err := cmd.Wait()
		a.pendingMu.Lock()
		for id, ch := range a.pending {
			ch <- backendEnvelope{ID: id, Error: "Desktop backend process stopped unexpectedly."}
			close(ch)
		}
		a.pending = make(map[string]chan backendEnvelope)
		a.pendingMu.Unlock()

		if err != nil && a.ctx != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Node backend exited: %v", err))
		}
	}()

	return nil
}

func (a *App) stopBackend() {
	if a.backendIn != nil {
		_ = a.backendIn.Close()
	}

	if a.backendCmd != nil && a.backendCmd.Process != nil {
		_ = a.backendCmd.Process.Kill()
	}
}

func (a *App) readBackendOutput(stdout io.ReadCloser) {
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 0, 64*1024), 10*1024*1024)

	for scanner.Scan() {
		line := scanner.Bytes()
		var envelope backendEnvelope
		if err := json.Unmarshal(line, &envelope); err != nil {
			if a.ctx != nil {
				runtime.LogError(a.ctx, fmt.Sprintf("Failed to parse backend message: %v", err))
			}
			continue
		}

		if envelope.Event != "" {
			var payload any
			if len(envelope.Payload) > 0 {
				if err := json.Unmarshal(envelope.Payload, &payload); err != nil {
					payload = string(envelope.Payload)
				}
			}
			if a.ctx != nil {
				runtime.EventsEmit(a.ctx, envelope.Event, payload)
			}
			continue
		}

		if envelope.ID == "" {
			continue
		}

		a.pendingMu.Lock()
		ch, ok := a.pending[envelope.ID]
		if ok {
			delete(a.pending, envelope.ID)
		}
		a.pendingMu.Unlock()

		if ok {
			ch <- envelope
			close(ch)
		}
	}
}

func (a *App) callBackend(method string, target any, args ...any) error {
	if err := a.ensureBackend(); err != nil {
		return err
	}

	id := fmt.Sprintf("req-%d", atomic.AddUint64(&a.requestID, 1))
	request := backendRequest{
		ID:     id,
		Method: method,
		Args:   args,
	}

	payload, err := json.Marshal(request)
	if err != nil {
		return err
	}

	responseCh := make(chan backendEnvelope, 1)
	a.pendingMu.Lock()
	a.pending[id] = responseCh
	a.pendingMu.Unlock()

	a.writeMu.Lock()
	_, writeErr := fmt.Fprintf(a.backendIn, "%s\n", payload)
	a.writeMu.Unlock()

	if writeErr != nil {
		a.pendingMu.Lock()
		delete(a.pending, id)
		a.pendingMu.Unlock()
		return writeErr
	}

	select {
	case response, ok := <-responseCh:
		if !ok {
			return errors.New("desktop backend response channel closed unexpectedly")
		}
		if response.Error != "" {
			return errors.New(response.Error)
		}
		if target == nil || len(response.Result) == 0 || string(response.Result) == "null" {
			return nil
		}
		return json.Unmarshal(response.Result, target)
	case <-time.After(5 * time.Minute):
		a.pendingMu.Lock()
		delete(a.pending, id)
		a.pendingMu.Unlock()
		return errors.New("desktop backend request timed out")
	}
}

func normalizeDialogPath(input string) (string, string) {
	cleaned := strings.TrimSpace(input)
	if cleaned == "" {
		return "", ""
	}

	info, err := os.Stat(cleaned)
	if err == nil {
		if info.IsDir() {
			return cleaned, ""
		}
		return filepath.Dir(cleaned), filepath.Base(cleaned)
	}

	parent := filepath.Dir(cleaned)
	if parent != "." {
		if parentInfo, parentErr := os.Stat(parent); parentErr == nil && parentInfo.IsDir() {
			return parent, filepath.Base(cleaned)
		}
	}

	return "", ""
}

func normalizeExistingPath(input string) string {
	cleaned := filepath.Clean(strings.TrimSpace(input))
	if cleaned == "." || cleaned == "" {
		return ""
	}
	return cleaned
}

func (a *App) AppMinimizeWindow() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) AppToggleMaximizeWindow() bool {
	wasMaximised := runtime.WindowIsMaximised(a.ctx)
	if wasMaximised {
		runtime.WindowUnmaximise(a.ctx)
		return false
	}

	runtime.WindowMaximise(a.ctx)
	return true
}

func (a *App) AppCloseWindow() {
	runtime.Quit(a.ctx)
}

func (a *App) DayzPickFolder(options PickPathOptions) (string, error) {
	defaultDirectory, _ := normalizeDialogPath(options.DefaultPath)
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Folder",
		DefaultDirectory: defaultDirectory,
	})
}

func (a *App) DayzPickExecutable(options PickPathOptions) (string, error) {
	defaultDirectory, defaultFilename := normalizeDialogPath(options.DefaultPath)
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Executable",
		DefaultDirectory: defaultDirectory,
		DefaultFilename:  defaultFilename,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Executable",
				Pattern:     "*.exe",
			},
		},
	})
}

func (a *App) DayzOpenPath(targetPath string) error {
	normalizedPath := normalizeExistingPath(targetPath)
	if normalizedPath == "" {
		return errors.New("path is required")
	}

	info, err := os.Stat(normalizedPath)
	if err != nil {
		return fmt.Errorf("path was not found: %s", normalizedPath)
	}

	var cmd *exec.Cmd
	if info.IsDir() {
		cmd = exec.Command("explorer.exe", normalizedPath)
	} else {
		cmd = exec.Command("explorer.exe", "/select,", normalizedPath)
	}

	return cmd.Start()
}

func (a *App) DayzDetectClientExecutable() (string, error) {
	var result string
	err := a.callBackend("dayz:detect-client-executable", &result)
	return result, err
}

func (a *App) DayzDetectServerPaths(serverRoot string) (any, error) {
	var result any
	err := a.callBackend("dayz:detect-server-paths", &result, serverRoot)
	return result, err
}

func (a *App) DayzAutoDetectServerPaths() (any, error) {
	var result any
	err := a.callBackend("dayz:auto-detect-server-paths", &result)
	return result, err
}

func (a *App) DayzGetServerRuntime() (any, error) {
	var result any
	err := a.callBackend("dayz:get-runtime", &result)
	return result, err
}

func (a *App) DayzGetClientRuntime() (any, error) {
	var result any
	err := a.callBackend("dayz:get-client-runtime", &result)
	return result, err
}

func (a *App) DayzStartServer(options any) (any, error) {
	var result any
	err := a.callBackend("dayz:start-server", &result, options)
	return result, err
}

func (a *App) DayzStopServer() (any, error) {
	var result any
	err := a.callBackend("dayz:stop-server", &result)
	return result, err
}

func (a *App) DayzRestartServer(options any) (any, error) {
	var result any
	err := a.callBackend("dayz:restart-server", &result, options)
	return result, err
}

func (a *App) DayzReadServerConfig(configPath string) (any, error) {
	var result any
	err := a.callBackend("dayz:read-server-config", &result, configPath)
	return result, err
}

func (a *App) DayzWriteServerConfig(options any) (any, error) {
	var result any
	err := a.callBackend("dayz:write-server-config", &result, options)
	return result, err
}

func (a *App) DayzScanMissions(missionsRoot string) (any, error) {
	var result any
	err := a.callBackend("dayz:scan-missions", &result, missionsRoot)
	return result, err
}

func (a *App) DayzReadMissionSessionSettings(missionPath string) (any, error) {
	var result any
	err := a.callBackend("dayz:read-mission-session-settings", &result, missionPath)
	return result, err
}

func (a *App) DayzPreviewInitGenerator(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:preview-init-generator", &result, request)
	return result, err
}

func (a *App) DayzBackupInitGenerator(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:backup-init-generator", &result, request)
	return result, err
}

func (a *App) DayzApplyInitGenerator(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:apply-init-generator", &result, request)
	return result, err
}

func (a *App) DayzScanMods(serverRoot string) (any, error) {
	var result any
	err := a.callBackend("dayz:scan-mods", &result, serverRoot)
	return result, err
}

func (a *App) DayzScanWorkshopMods(serverRoot string) (any, error) {
	var result any
	err := a.callBackend("dayz:scan-workshop-mods", &result, serverRoot)
	return result, err
}

func (a *App) DayzInspectModFolder(modRoot string) (any, error) {
	var result any
	err := a.callBackend("dayz:inspect-mod-folder", &result, modRoot)
	return result, err
}

func (a *App) DayzDeleteMod(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:delete-mod", &result, request)
	return result, err
}

func (a *App) DayzScanCrashTools(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:scan-crash-tools", &result, request)
	return result, err
}

func (a *App) DayzDeleteCrashArtifacts(request any) (any, error) {
	var result any
	err := a.callBackend("dayz:delete-crash-artifacts", &result, request)
	return result, err
}

func (a *App) DayzLaunchClient(options any) (any, error) {
	var result any
	err := a.callBackend("dayz:launch-client", &result, options)
	return result, err
}

func (a *App) DayzStopClient() (any, error) {
	var result any
	err := a.callBackend("dayz:stop-client", &result)
	return result, err
}

func (a *App) DayzGetWorkspaceState() (any, error) {
	var result any
	err := a.callBackend("dayz:get-workspace-state", &result)
	return result, err
}

func (a *App) DayzSaveWorkspaceState(state any) (any, error) {
	var result any
	err := a.callBackend("dayz:save-workspace-state", &result, state)
	return result, err
}
