"use client";

import { useState, useEffect } from "react";

interface NotionDatabase {
  id: string;
  title: string;
}

export default function SettingsPage() {
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  // Google Sheets state
  const [sheetsServiceAccount, setSheetsServiceAccount] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetsSaving, setSheetsSaving] = useState(false);
  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<string | null>(null);
  const [sheetsMessage, setSheetsMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.notion_token) setNotionToken(data.notion_token);
        if (data.notion_database_id) setNotionDatabaseId(data.notion_database_id);
        if (data.notion_auto_sync !== undefined) setAutoSync(data.notion_auto_sync);
        if (data.google_service_account) setSheetsServiceAccount("configured");
        if (data.google_spreadsheet_id) setSpreadsheetId(data.google_spreadsheet_id);
      })
      .catch(console.error);
  }, []);

  const saveToken = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notion_token: notionToken }),
      });
      if (res.ok) {
        setMessage("Token saved. You can now select a database.");
      }
    } catch {
      setMessage("Failed to save token.");
    } finally {
      setSaving(false);
    }
  };

  const fetchDatabases = async () => {
    setLoadingDatabases(true);
    setMessage(null);
    try {
      const res = await fetch("/api/notion/databases");
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        setDatabases(data);
        if (data.length === 0) {
          setMessage(
            "No databases found. Make sure you've shared a database with your Notion integration."
          );
        }
      }
    } catch {
      setMessage("Failed to fetch databases.");
    } finally {
      setLoadingDatabases(false);
    }
  };

  const selectDatabase = async (dbId: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notion_database_id: dbId }),
      });
      if (res.ok) {
        setNotionDatabaseId(dbId);
        setMessage("Database selected! Notion sync is now active.");
        // Set up required properties on the database
        await fetch("/api/notion/setup", { method: "POST" });
      }
    } catch {
      setMessage("Failed to save database selection.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoSync = async () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notion_auto_sync: newValue }),
    });
  };

  const syncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        setSyncResult(data.error);
      } else {
        setSyncResult(`Synced: ${data.synced}, Failed: ${data.failed}`);
      }
    } catch {
      setSyncResult("Sync request failed.");
    } finally {
      setSyncing(false);
    }
  };

  const saveSheetsConfig = async () => {
    setSheetsSaving(true);
    setSheetsMessage(null);
    try {
      const settings: Record<string, unknown> = {};
      if (sheetsServiceAccount && sheetsServiceAccount !== "configured") {
        // Validate JSON
        try {
          JSON.parse(sheetsServiceAccount);
        } catch {
          setSheetsMessage("Invalid JSON. Paste the full service account JSON key file.");
          setSheetsSaving(false);
          return;
        }
        settings.google_service_account = sheetsServiceAccount;
      }
      if (spreadsheetId) {
        settings.google_spreadsheet_id = spreadsheetId;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        if (sheetsServiceAccount && sheetsServiceAccount !== "configured") {
          setSheetsServiceAccount("configured");
        }
        setSheetsMessage("Google Sheets configuration saved.");
        // Ensure headers exist
        if (spreadsheetId) {
          await fetch("/api/sheets/setup", { method: "POST" });
        }
      }
    } catch {
      setSheetsMessage("Failed to save configuration.");
    } finally {
      setSheetsSaving(false);
    }
  };

  const syncAllSheets = async () => {
    setSheetsSyncing(true);
    setSheetsSyncResult(null);
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        setSheetsSyncResult(data.error);
      } else {
        setSheetsSyncResult(`Synced: ${data.synced}, Failed: ${data.failed}`);
      }
    } catch {
      setSheetsSyncResult("Sync request failed.");
    } finally {
      setSheetsSyncing(false);
    }
  };

  const isConnected = notionToken && notionDatabaseId;
  const isSheetsConnected = sheetsServiceAccount && spreadsheetId;

  return (
    <div className="mx-auto max-w-lg flex flex-col gap-8">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Notion Integration */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notion Integration</h3>
          {isConnected && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              Connected
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-500">
          Connect to Notion to sync your time entries to a database.{" "}
          <a
            href="https://www.notion.so/my-integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Create an integration
          </a>{" "}
          and paste the token below.
        </p>

        {/* Step 1: Token */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Integration Token
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="ntn_..."
            />
            <button
              onClick={saveToken}
              disabled={saving || !notionToken}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Step 2: Database selection */}
        {notionToken && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Target Database
            </label>
            {notionDatabaseId ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {databases.find((d) => d.id === notionDatabaseId)?.title ??
                    `Database: ${notionDatabaseId.slice(0, 8)}...`}
                </span>
                <button
                  onClick={() => {
                    setNotionDatabaseId("");
                    fetchDatabases();
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={fetchDatabases}
                  disabled={loadingDatabases}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {loadingDatabases
                    ? "Loading..."
                    : "Load Available Databases"}
                </button>
                {databases.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {databases.map((db) => (
                      <button
                        key={db.id}
                        onClick={() => selectDatabase(db.id)}
                        className="rounded-md border border-zinc-200 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      >
                        {db.title || "Untitled"}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Auto-sync toggle */}
        {isConnected && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-sync on save</span>
            <button
              onClick={toggleAutoSync}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSync ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSync ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        {/* Manual sync */}
        {isConnected && (
          <div>
            <button
              onClick={syncAll}
              disabled={syncing}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {syncing ? "Syncing..." : "Sync All Pending Entries"}
            </button>
            {syncResult && (
              <p className="mt-2 text-sm text-zinc-500">{syncResult}</p>
            )}
          </div>
        )}

        {message && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        )}
      </div>

      {/* Google Sheets Integration */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Google Sheets Integration</h3>
          {isSheetsConnected && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              Connected
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-500">
          Sync time entries to a Google Spreadsheet. Create a{" "}
          <a
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            service account
          </a>
          , download the JSON key, and share your spreadsheet with the service account email.
        </p>

        {/* Service Account JSON */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Service Account Key (JSON)
          </label>
          {sheetsServiceAccount === "configured" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Service account configured
              </span>
              <button
                onClick={() => setSheetsServiceAccount("")}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Replace
              </button>
            </div>
          ) : (
            <textarea
              value={sheetsServiceAccount}
              onChange={(e) => setSheetsServiceAccount(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900"
              placeholder='{"type": "service_account", ...}'
              rows={4}
            />
          )}
        </div>

        {/* Spreadsheet ID */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Spreadsheet ID
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="From the spreadsheet URL: /d/{spreadsheet-id}/edit"
          />
        </div>

        {/* Save button */}
        <button
          onClick={saveSheetsConfig}
          disabled={sheetsSaving || (!sheetsServiceAccount && !spreadsheetId)}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {sheetsSaving ? "Saving..." : "Save Configuration"}
        </button>

        {/* Manual sync */}
        {isSheetsConnected && (
          <div>
            <button
              onClick={syncAllSheets}
              disabled={sheetsSyncing}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {sheetsSyncing ? "Syncing..." : "Sync All Pending Entries"}
            </button>
            {sheetsSyncResult && (
              <p className="mt-2 text-sm text-zinc-500">{sheetsSyncResult}</p>
            )}
          </div>
        )}

        {sheetsMessage && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {sheetsMessage}
          </p>
        )}
      </div>
    </div>
  );
}
