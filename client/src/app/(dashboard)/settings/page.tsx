"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, CreditCard, MessageSquare, RefreshCw } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  const fetchSettings = async () => {
    try {
      const storedSettings = localStorage.getItem("settingsData");
      if (!storedSettings) throw new Error("Settings not found in localStorage");

      const local = JSON.parse(storedSettings);
      const chat_token = local.chat_token;

      const res = await fetch(`${BASE_URL}/api/settings/get-detailed-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: local.user_id, chat_token }),
      });

      const data = await res.json();
      if (data.success) {
        setSettingsData(data.data);
        setAutoRenew(data.data.settings.subscription_autorenewal);
        localStorage.setItem("settingsData", JSON.stringify(data.data.settings));
      } else {
        toast.error("Failed to fetch settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!settingsData) return;

    try {
      const res = await fetch(`${BASE_URL}/api/settings/update-autorenew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: settingsData.settings.user_id,
          chat_token: settingsData.settings.chat_token,
          subscription_autorenewal: !autoRenew,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAutoRenew(!autoRenew);
        toast.success("Auto-renew updated!");
        const updatedSettings = { ...settingsData.settings, subscription_autorenewal: !autoRenew };
        setSettingsData({ ...settingsData, settings: updatedSettings });
        localStorage.setItem("settingsData", JSON.stringify(updatedSettings));
      } else {
        toast.error("Failed to update auto-renew");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating auto-renew");
    }
  };

  const handleCancelSubscription = async () => {
    if (!settingsData) return;

    try {
      const res = await fetch(`${BASE_URL}/api/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: settingsData.settings.user_id,
          chat_token: settingsData.settings.chat_token,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Subscription canceled successfully!");
        fetchSettings();
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error canceling subscription");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) return <div className="p-4 text-white">Loading settings...</div>;
  if (!settingsData) return <div className="p-4 text-white">No settings found.</div>;

  const { settings, payments, consumedMessages, remainingMessages } = settingsData;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Account Dashboard</h1>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card className="bg-[#1E293B] text-white">
          <CardHeader className="flex items-center gap-2">
            <CalendarDays size={20} />
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription className="text-white text-base font-medium">
              <strong>Subscription ID:</strong> {settings.subscription_id || "-"}
            </CardDescription>
            <CardDescription className="text-white text-base font-medium">
              <strong>Messages Used:</strong> {consumedMessages}
            </CardDescription>
            <CardDescription className="text-white text-base font-medium">
              <strong>Remaining Messages:</strong> {remainingMessages}
            </CardDescription>
          </CardContent>
        </Card>


        <Card className="bg-[#1E293B] text-white">
          <CardHeader className="flex items-center gap-2">
            <CalendarDays size={20} />
            <CardTitle>Subscription Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription className="text-white text-base font-medium">
              <strong>Start:</strong> {formatDate(settings.user_subscription_date)}
            </CardDescription>
            <CardDescription className="text-white text-base font-medium">
              <strong>End:</strong> {formatDate(settings.user_subscription_end_date)}
            </CardDescription>
            <CardDescription className="text-white text-base font-medium">
              <strong>Days Left:</strong> {settings.subscription_end_daysleft || "-"}
            </CardDescription>
          </CardContent>
        </Card>


        <Card className="bg-[#1E293B] text-white">
          <CardHeader className="flex items-center gap-2">
            <CalendarDays size={20} />
            <CardTitle>Manage Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.subscription_id ?
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Auto-Renew:</span>
                <Switch checked={autoRenew} onCheckedChange={handleToggleAutoRenew} />
              </div>
              : 
              <>
              <p>No subscription plan purchased</p>
              </>
            }
            {settings.subscription_id && (
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      </div>



      <Card className="bg-[#1E293B] text-white">
        <CardHeader className="flex items-center gap-2">
          <CreditCard size={20} />
          <CardTitle>Payments History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payments.length === 0 ? (
            <p>No payments found.</p>
          ) : (
            payments.map((payment: any) => (
              <div key={payment.id} className="p-3 bg-[#101828] rounded flex justify-between items-center">
                <div>
                  <p><strong>Payment ID:</strong> {payment.id}</p>
                  <p><strong>Subscription ID:</strong> {payment.subscription_id}</p>
                </div>
                <div>
                  <p><strong>Card:</strong> **** **** **** {payment.card_number.slice(-4)}</p>
                  <p><strong>Card Expiry:</strong> {payment.card_expiry_date}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button onClick={fetchSettings} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 w-full md:w-auto">
        <RefreshCw size={16} /> Refresh Settings
      </Button>
    </div>
  );
}
