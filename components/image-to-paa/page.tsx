"use client";

import { useMemo, useState } from "react";
import { FileImage, FolderOpen, Layers3, MousePointer2, Sparkles, WandSparkles } from "lucide-react";

import { SelectField, ToggleField } from "@/components/dayz-server/form-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const Icon = icon;

  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/25">
              <Icon className="size-4 text-muted-foreground" />
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  note,
  control,
}: {
  label: string;
  note: string;
  control: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0 xl:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </div>
      <div>{control}</div>
    </div>
  );
}

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/30 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

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
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Image To PAA</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Compact desktop workspace for preparing source textures, conversion profiles and batch queues.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Workspace Ready</Badge>
              <Badge variant="outline">Backend Next</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
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
        </CardContent>
      </Card>

      <Section
        title="Texture List"
        description="Files that will be staged for conversion from folder scan or drag & drop."
        icon={FileImage}
      >
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/25">
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="grid grid-cols-[220px_90px_minmax(0,1fr)_90px] border-b border-border/60 bg-muted/20 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                      : "bg-background/30 text-foreground hover:bg-muted/20"
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
            <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selected Texture</p>
              <p className="mt-2 text-sm font-medium text-foreground">{selectedTexture.name}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{selectedTexture.path}</p>
              <div className="mt-4 grid gap-3">
                <MetaCard label="Target" value={selectedTexture.target} />
                <MetaCard label="Preset" value={selectedPreset.label} />
                <MetaCard label="Format" value={format} />
                <MetaCard label="Alpha" value={alphaMode} />
                <MetaCard label="Details" value={`${selectedTexture.type} | ${selectedTexture.size}`} />
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="Pipeline"
          description="Source scope, paths and external conversion toolchain."
          icon={FolderOpen}
        >
          <Field
            label="Source Mode"
            note="Single image conversion or folder-based queue generation."
            control={
              <SelectField
                value={sourceMode === "single" ? "Single Image" : "Folder Batch"}
                options={["Single Image", "Folder Batch"]}
                onValueChange={(value) => setSourceMode(value === "Folder Batch" ? "folder" : "single")}
              />
            }
          />
          <Field
            label="Source Path"
            note={
              sourceMode === "single"
                ? "Input image file for direct conversion."
                : "Folder that will be scanned into a queue."
            }
            control={<Input value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} />}
          />
          <Field
            label="Output Folder"
            note="Destination for converted PAA files."
            control={<Input value={outputPath} onChange={(event) => setOutputPath(event.target.value)} />}
          />
          <Field
            label="TexView Path"
            note="Planned backend integration target for real PAA conversion."
            control={<Input value={texViewPath} onChange={(event) => setTexViewPath(event.target.value)} />}
          />
        </Section>

        <Section
          title="Conversion"
          description="Preset, format and preprocessing behavior."
          icon={WandSparkles}
        >
          <Field
            label="Preset"
            note="High-level DayZ-oriented preset for common texture workflows."
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
          <Field
            label="PAA Format"
            note="Compression/container mode for the exported texture."
            control={
              <SelectField
                value={format}
                options={["DXT1", "DXT5", "ARGB8888", "RGBA4444"]}
                onValueChange={setFormat}
              />
            }
          />
          <Field
            label="Alpha"
            note="How alpha should be treated during conversion."
            control={
              <SelectField
                value={alphaMode}
                options={["Auto", "Preserve", "Ignore"]}
                onValueChange={setAlphaMode}
              />
            }
          />
          <Field
            label="Resize"
            note="Optional resizing strategy before export."
            control={
              <SelectField
                value={resizeMode}
                options={["Keep Original", "Power Of Two", "Force 2048", "Force 4096"]}
                onValueChange={setResizeMode}
              />
            }
          />
          <Field
            label="Mipmaps"
            note="Recommended for in-world textures, usually disabled for clean UI icons."
            control={
              <ToggleField
                checked={generateMipmaps}
                label={generateMipmaps ? "Enabled" : "Disabled"}
                onCheckedChange={setGenerateMipmaps}
              />
            }
          />
          <Field
            label="Premultiply"
            note="Useful for some icon pipelines and alpha-heavy source material."
            control={
              <ToggleField
                checked={premultiplyAlpha}
                label={premultiplyAlpha ? "Enabled" : "Disabled"}
                onCheckedChange={setPremultiplyAlpha}
              />
            }
          />
          <Field
            label="Flip Vertical"
            note="Optional preprocessing step if source textures arrive inverted."
            control={
              <ToggleField
                checked={flipVertical}
                label={flipVertical ? "Enabled" : "Disabled"}
                onCheckedChange={setFlipVertical}
              />
            }
          />
        </Section>
      </div>
    </div>
  );
}
