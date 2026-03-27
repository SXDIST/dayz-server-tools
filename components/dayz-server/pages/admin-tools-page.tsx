"use client";

import { adminTools } from "@/components/dayz-server/constants";
import { Row, Section } from "@/components/dayz-server/workspace-shared";
import { Button } from "@/components/ui/button";

export function AdminToolsPage() {
  return (
    <Section title="Admin Tools" description="Select and initialize an admin tool.">
      {adminTools.map(([title, description]) => (
        <Row key={title} title={title} description={description} />
      ))}
      <div className="pt-4">
        <Button variant="default">Setup Selected Tool</Button>
      </div>
    </Section>
  );
}
