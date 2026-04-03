"use client";

import { useMemo, useState } from "react";
import { FileImage, FolderOpen, Layers3, MousePointer2, Sparkles, WandSparkles } from "lucide-react";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WorkspaceField,
  WorkspaceInfoRow,
  WorkspacePage,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspace/workspace-kit";

const imageToPaaPresets = [
  {
    id: "diffuse",
    label: "Diffuse Texture",
    note: "General-purpose albedo/diffuse conversion for clothing, gear and props.",
    format: "DXT5",
    mipmaps: true,
    alphaMode: "Auto",
  },
  {
    id: "ui-icon",
    label: "UI Icon",
    note: "Sharper edges, disabled mipmaps and alpha-friendly export for inventory icons.",
    format: "ARGB8888",
    mipmaps: false,
    alphaMode: "Preserve",
  },
  {
    id: "mask",
    label: "Mask / Alpha",
    note: "Alpha-oriented preset for signs, cutouts and layered details.",
    format: "DXT5",
    mipmaps: true,
    alphaMode: "Preserve",
  },
  {
    id: "terrain",
    label: "Terrain Detail",
    note: "Compact mipmapped detail texture preset for ground layers.",
    format: "DXT1",
    mipmaps: true,
    alphaMode: "Ignore",
  },
] as const;

export function ImageToPaaPage() {
  const [sourceMode, setSourceMode] = useState<"single" | "folder">("single");
  const [presetId, setPresetId] = useState<(typeof imageToPaaPresets)[number]["id"]>("diffuse");
  const [sourcePath, setSourcePath] = useState("P:\\MyMod\\Data\\textures");
  const [outputPath, setOutputPath] = useState("P:\\MyMod\\Data\\textures\\paa");
  const [texViewPath, setTexViewPath] = useState(
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ Tools\\Bin\\TexView2.exe",
  );
  const [format, setFormat] = useState("DXT5");
  const [alphaMode, setAlphaMode] = useState("Auto");
  const [resizeMode, setResizeMode] = useState("Keep Original");
  const [generateMipmaps, setGenerateMipmaps] = useState(true);
  const [premultiplyAlpha, setPremultiplyAlpha] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [selectedTextureId, setSelectedTextureId] = useState("cl_jacket_co.png-0");

  const selectedPreset =
    imageToPaaPresets.find((preset) => preset.id === presetId) ?? imageToPaaPresets[0];

  const textureItems = useMemo(() => {
    const baseFiles =
      sourceMode === "single"
        ? [
            {
              name: "cl_jacket_co.png",
              type: "PNG",
              path: "P:\\MyMod\\Data\\textures\\cl_jacket_co.png",
              size: "2.8 MB",
            },
          ]
        : [
            {
              name: "cl_jacket_co.png",
              type: "PNG",
              path: "P:\\MyMod\\Data\\textures\\cl_jacket_co.png",
              size: "2.8 MB",
            },
            {
              name: "cl_jacket_nohq.png",
              type: "PNG",
              path: "P:\\MyMod\\Data\\textures\\cl_jacket_nohq.png",
              size: "3.1 MB",
            },
            {
              name: "cl_jacket_smdi.png",
              type: "PNG",
              path: "P:\\MyMod\\Data\\textures\\cl_jacket_smdi.png",
              size: "1.7 MB",
            },
            {
              name: "cl_jacket_em.png",
              type: "PNG",
              path: "P:\\MyMod\\Data\\textures\\cl_jacket_em.png",
              size: "1.2 MB",
            },
          ];

    return baseFiles.map((file, index) => ({
      id: `${file.name}-${index}`,
      ...file,
      target: file.name.replace(/\.[^.]+$/, ".paa"),
    }));
  }, [sourceMode]);

  const selectedTexture =
    textureItems.find((item) => item.id === selectedTextureId) ?? textureItems[0] ?? null;

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow="Texture Pipeline"
        title="Image To PAA"
        description="A tighter production-style conversion workspace: queue source textures, lock a preset, review the current target and run the exact action you need without hunting through placeholder panels."
        actions={
          <>
            <Badge variant="secondary">Workspace Ready</Badge>
            <Badge variant="outline">Backend Next</Badge>
          </>
        }
      />

      <WorkspacePanel
        title="Conversion Actions"
        description="Build the queue, run the selected item or expand the source set."
        contentClassName="flex flex-wrap gap-3"
      >
        <Button className="gap-2">
            <Layers3 className="size-4" />
            Build Queue
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="size-4" />
            Convert Selected
          </Button>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="size-4" />
            Add Folder
          </Button>
      </WorkspacePanel>

      <WorkspacePanel
        title="Texture List"
        description="Files that will be staged for conversion from folder scan or drag & drop."
        icon={FileImage}
      >
        <div className="rounded-lg border border-dashed bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                <MousePointer2 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drag & Drop Workspace</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drop textures here or point the module to a folder. The list below becomes the active conversion queue.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Add Images
              </Button>
              <Button variant="outline" size="sm">
                Scan Folder
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[220px_90px_minmax(0,1fr)_90px] border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Type</span>
              <span>Path</span>
              <span>Size</span>
            </div>
            <div className="max-h-[460px] overflow-auto">
              {textureItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTextureId(item.id)}
                  className={`grid w-full grid-cols-[220px_90px_minmax(0,1fr)_90px] items-center border-b border-border/50 px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                    selectedTextureId === item.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-background text-foreground hover:bg-muted/20"
                  }`}
                >
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="truncate text-muted-foreground">{item.path}</span>
                  <span className="text-muted-foreground">{item.size}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedTexture ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">Selected Texture</p>
              <p className="mt-2 text-sm font-medium text-foreground">{selectedTexture.name}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{selectedTexture.path}</p>
              <div className="mt-4 grid gap-3">
                <WorkspaceInfoRow label="Target" value={selectedTexture.target} />
                <WorkspaceInfoRow label="Preset" value={selectedPreset.label} />
                <WorkspaceInfoRow label="Format" value={format} />
                <WorkspaceInfoRow label="Alpha" value={alphaMode} />
                <WorkspaceInfoRow label="Details" value={`${selectedTexture.type} | ${selectedTexture.size}`} />
              </div>
            </div>
          ) : null}
        </div>
      </WorkspacePanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <WorkspacePanel
          title="Pipeline"
          description="Source scope, paths and external conversion toolchain."
          icon={FolderOpen}
        >
          <WorkspaceField
            label="Source Mode"
            description="Single image conversion or folder-based queue generation."
            control={
              <SelectField
                value={sourceMode}
                options={[
                  { value: "single", label: "Single Image" },
                  { value: "folder", label: "Folder Batch" },
                ]}
                onValueChange={(value) => setSourceMode(value === "folder" ? "folder" : "single")}
              />
            }
          />
          <WorkspaceField
            label="Source Path"
            description={
              sourceMode === "single"
                ? "Input image file for direct conversion."
                : "Folder that will be scanned into a queue."
            }
            control={<Input value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} />}
          />
          <WorkspaceField
            label="Output Folder"
            description="Destination for converted PAA files."
            control={<Input value={outputPath} onChange={(event) => setOutputPath(event.target.value)} />}
          />
          <WorkspaceField
            label="TexView Path"
            description="Planned backend integration target for real PAA conversion."
            control={<Input value={texViewPath} onChange={(event) => setTexViewPath(event.target.value)} />}
          />
        </WorkspacePanel>

        <WorkspacePanel
          title="Conversion"
          description="Preset, format and preprocessing behavior."
          icon={WandSparkles}
        >
          <WorkspaceField
            label="Preset"
            description="High-level DayZ-oriented preset for common texture workflows."
            control={
              <SelectField
                value={presetId}
                options={imageToPaaPresets.map((preset) => ({
                  value: preset.id,
                  label: preset.label,
                }))}
                onValueChange={(value) => {
                  const nextPreset =
                    imageToPaaPresets.find((preset) => preset.id === value) ?? imageToPaaPresets[0];
                  setPresetId(nextPreset.id);
                  setFormat(nextPreset.format);
                  setGenerateMipmaps(nextPreset.mipmaps);
                  setAlphaMode(nextPreset.alphaMode);
                }}
              />
            }
          />
          <WorkspaceField
            label="PAA Format"
            description="Compression/container mode for the exported texture."
            control={
              <SelectField
                value={format}
                options={["DXT1", "DXT5", "ARGB8888", "RGBA4444"]}
                onValueChange={setFormat}
              />
            }
          />
          <WorkspaceField
            label="Alpha"
            description="How alpha should be treated during conversion."
            control={
              <SelectField
                value={alphaMode}
                options={["Auto", "Preserve", "Ignore"]}
                onValueChange={setAlphaMode}
              />
            }
          />
          <WorkspaceField
            label="Resize"
            description="Optional resizing strategy before export."
            control={
              <SelectField
                value={resizeMode}
                options={["Keep Original", "Power Of Two", "Force 2048", "Force 4096"]}
                onValueChange={setResizeMode}
              />
            }
          />
          <WorkspaceField
            label="Mipmaps"
            description="Recommended for in-world textures, usually disabled for clean UI icons."
            control={
              <ToggleField
                checked={generateMipmaps}
                label={generateMipmaps ? "Enabled" : "Disabled"}
                onCheckedChange={setGenerateMipmaps}
              />
            }
          />
          <WorkspaceField
            label="Premultiply"
            description="Useful for some icon pipelines and alpha-heavy source material."
            control={
              <ToggleField
                checked={premultiplyAlpha}
                label={premultiplyAlpha ? "Enabled" : "Disabled"}
                onCheckedChange={setPremultiplyAlpha}
              />
            }
          />
          <WorkspaceField
            label="Flip Vertical"
            description="Optional preprocessing step if source textures arrive inverted."
            control={
              <ToggleField
                checked={flipVertical}
                label={flipVertical ? "Enabled" : "Disabled"}
                onCheckedChange={setFlipVertical}
              />
            }
          />
        </WorkspacePanel>
      </div>
    </WorkspacePage>
  );
}
