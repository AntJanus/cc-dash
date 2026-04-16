import { loadConfig } from "@/lib/config";
import { SettingsForm } from "@/components/settings/settings-form";
import { ArchivedProjectsSection } from "@/components/settings/archived-projects-section";
import { AutoRefreshSettings } from "@/components/settings/auto-refresh-settings";
import { getArchivedProjects } from "@/lib/actions/archive-actions";

export default async function SettingsPage() {
  const [config, archivedProjects] = await Promise.all([
    loadConfig(),
    getArchivedProjects(),
  ]);
  return (
    <main className="p-8 lg:p-10">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <SettingsForm initialConfig={config} />
      <div className="mt-10 max-w-2xl">
        <AutoRefreshSettings />
      </div>
      <div className="mt-10 max-w-2xl">
        <ArchivedProjectsSection initialProjects={archivedProjects} />
      </div>
    </main>
  );
}
