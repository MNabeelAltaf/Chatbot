"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface SettingsData {
  user_id: number;
  subscription_id: number | null;
  user_messages_limit: number;
  chat_token?: string;
}

interface SubscriptionPlan {
  id: number;
  subscription_type: string;
  billing_cycle: string;
  price: number;
  max_message: string;
}

export default function SubscriptionPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [cardNumber, setCardNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [expiry, setExpiry] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem("settingsData");
    if (storedSettings) setSettings(JSON.parse(storedSettings));

    getPlans();
  }, []);


  const getPlans = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/subscription/plans`);
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const filteredPlans = plans.filter(
    (plan) => plan.billing_cycle.toLowerCase() === activeTab
  );



  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!settings || !selectedPlan) return;
    setPurchaseLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/subscription/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: settings.user_id,
          chat_token: settings.chat_token,
          subscription_id: selectedPlan.id,
          auto_renew: autoRenew,
          card_number: cardNumber,
          cvc,
          card_expiry_date: expiry,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Subscription purchased successfully!");

        const settingsRes = await fetch(`${BASE_URL}/api/settings/get-settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: settings.user_id,
            chat_token: settings.chat_token,
          }),
        });

        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setSettings(settingsData.data);
          localStorage.setItem("settingsData", JSON.stringify(settingsData.data));
          window.dispatchEvent(new Event("settingsUpdated"));
        }

        setModalOpen(false);
      } else {
        toast.error(`Purchase failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while purchasing.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (!settings) return <div>Loading user data...</div>;
  if (loading) return <div>Loading subscription plans...</div>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Subscription Plans</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "monthly"
            ? "bg-indigo-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "yearly"
            ? "bg-indigo-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="bg-[#1E293B] p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">{plan.subscription_type}</h2>
            <p>Billing: {plan.billing_cycle}</p>
            <p>Price: ${plan.price}</p>
            <p>Max messages: {plan.max_message}</p>

            {settings?.subscription_id === plan.id ? (
              <Button
                className="mt-2 w-full bg-gray-500 text-white cursor-not-allowed"
                disabled
              >
                Purchased
              </Button>
            ) : (
              <Button
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleSubscribeClick(plan)}
              >
                Subscribe
              </Button>
            )}
          </div>
        ))}

      </div>


      {modalOpen && selectedPlan && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="bg-[#1E293B] text-white p-6 rounded-lg w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe: {selectedPlan.subscription_type}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-2 my-4">
              <span>Auto Renewal:</span>
              <Switch
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
              />
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Card Number"
                className="w-full p-2 rounded bg-gray-700 text-white"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <input
                type="text"
                placeholder="CVC"
                className="w-full p-2 rounded bg-gray-700 text-white"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
              />
              <input
                type="month"
                className="w-full p-2 rounded bg-gray-700 text-white"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YYYY"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handlePurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? "Processing..." : "Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
