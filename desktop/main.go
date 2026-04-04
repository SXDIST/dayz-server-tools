package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	windowsoptions "github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend-dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:            "DayZ Tools Launcher",
		Width:            1600,
		Height:           1020,
		MinWidth:         1240,
		MinHeight:        820,
		Frameless:        false,
		DisableResize:    false,
		BackgroundColour: &options.RGBA{R: 7, G: 17, B: 31, A: 1},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
		Windows: &windowsoptions.Options{},
	})
	if err != nil {
		log.Fatal(err)
	}
}
