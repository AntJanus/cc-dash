import { loadConfig } from "@/lib/config";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const config = await loadConfig();
  return (
    <main className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <SettingsForm initialConfig={config} />
    </main>
  );
}
