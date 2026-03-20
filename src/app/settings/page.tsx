import { loadConfig } from "@/lib/config";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const config = await loadConfig();
  return (
    <main className="p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <SettingsForm initialConfig={config} />
    </main>
  );
}
