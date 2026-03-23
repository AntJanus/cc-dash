import { loadConfig } from "@/lib/config";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const config = await loadConfig();
  return (
    <main className="p-8 lg:p-10">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <SettingsForm initialConfig={config} />
    </main>
  );
}
