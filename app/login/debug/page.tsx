"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [checks, setChecks] = useState<Record<string, any>>({});
  const supabase = createClient();

  useEffect(() => {
    async function runChecks() {
      const results: Record<string, any> = {};

      // Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      results.envUrl = url ? "✅ Set" : "❌ Missing";
      results.envKey = key ? "✅ Set" : "❌ Missing";
      results.envUrlValue = url || "Not set";
      results.envKeyPreview = key ? `${key.substring(0, 30)}...` : "Not set";

      // Validate key format (JWT tokens start with eyJ)
      if (key && !key.startsWith("eyJ")) {
        results.keyFormat = "⚠️ Key doesn't look like a valid JWT (should start with 'eyJ')";
      } else if (key) {
        results.keyFormat = "✅ Key format looks valid";
      }

      // Test basic Supabase client initialization
      try {
        const testClient = supabase;
        results.clientInit = "✅ Client initialized";
      } catch (err: any) {
        results.clientInit = `❌ Client init error: ${err.message}`;
      }

      // Check Supabase connection - try a simple query
      try {
        const { data, error } = await supabase.from("profiles").select("count").limit(1);
        if (error) {
          results.connection = `❌ Error: ${error.message}`;
          results.connectionCode = error.code || "unknown";
          results.connectionDetails = error.details || "No details";
          results.connectionHint = error.message.includes("Invalid API key") 
            ? "💡 Your anon key is incorrect. Get it from Supabase Dashboard → Settings → API → anon public key"
            : error.message.includes("JWT") 
            ? "💡 Your API key format is invalid. Make sure you copied the entire key."
            : "";
        } else {
          results.connection = "✅ Connected successfully";
          results.connectionCode = "success";
        }
      } catch (err: any) {
        results.connection = `❌ Exception: ${err.message}`;
        results.connectionCode = "exception";
      }

      // Check auth endpoint
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          results.auth = `❌ Auth error: ${error.message}`;
        } else {
          results.auth = session ? `✅ Logged in as ${session.user.email}` : "✅ Auth working (not logged in)";
        }
      } catch (err: any) {
        results.auth = `❌ Auth exception: ${err.message}`;
      }

      // Test RLS by trying to read profiles
      try {
        const { data, error } = await supabase.from("profiles").select("id").limit(1);
        if (error) {
          results.rls = `⚠️ RLS may be blocking: ${error.message}`;
        } else {
          results.rls = "✅ Can query profiles table";
        }
      } catch (err: any) {
        results.rls = `❌ RLS test error: ${err.message}`;
      }

      setChecks(results);
    }

    runChecks();
  }, [supabase]);

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="space-y-2">
                <div>
                  <strong>Supabase URL:</strong> {checks.envUrl}
                  <div className="text-xs text-muted-foreground mt-1">
                    {checks.envUrlValue}
                  </div>
                </div>
                <div>
                  <strong>Supabase Key:</strong> {checks.envKey}
                  <div className="text-xs text-muted-foreground mt-1">
                    {checks.envKeyPreview}
                  </div>
                  {checks.keyFormat && (
                    <div className="text-xs mt-1">{checks.keyFormat}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <strong>Client Initialization:</strong> {checks.clientInit || "Checking..."}
              </div>
              <div>
                <strong>Database Connection:</strong> {checks.connection || "Testing..."}
                {checks.connectionHint && (
                  <div className="text-sm text-yellow-600 mt-1 p-2 bg-yellow-50 rounded">
                    {checks.connectionHint}
                  </div>
                )}
                {checks.connectionCode && checks.connectionCode !== "success" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Error code: {checks.connectionCode}
                  </div>
                )}
              </div>
              <div>
                <strong>Auth Status:</strong> {checks.auth || "Checking..."}
              </div>
              <div>
                <strong>RLS Test:</strong> {checks.rls || "Testing..."}
              </div>
            </div>

            {checks.connectionCode === "success" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 font-medium">
                  ✅ Connection successful! You can now try logging in.
                </p>
              </div>
            )}

            {checks.connectionCode && checks.connectionCode !== "success" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900 font-medium mb-2">
                  ❌ Connection failed. Here&apos;s how to fix it:
                </p>
                <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                  <li>Go to Supabase Dashboard → Settings → API</li>
                  <li>Copy the <strong>anon</strong> <code>public</code> key (not service_role)</li>
                  <li>Update <code>.env.local</code> with the correct key</li>
                  <li>Restart your dev server (<code>npm run dev</code>)</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
