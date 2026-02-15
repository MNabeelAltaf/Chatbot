"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const HomePage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChatClick = async () => {
    setLoading(true);
    try {

      const res = await fetch(`${BASE_URL}/api/initialize-chat`, {
        method: "GET",
      });
      const data = await res.json();

      if (data.success) {
            
        localStorage.setItem(
          "settingsData",
          JSON.stringify({
            ...data.data.settingsData,
            chat_token: data.data.chat_token,
          })
        );

        router.push(`/chat?chat_token=${data.data.chat_token}`);
      }

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-center text-white p-6">
      <Card className="bg-gray-800/70 border-gray-700 text-white max-w-2xl shadow-2xl">
        <CardContent className="p-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Your Personal AI Assistant
          </h1>
          <p className="text-gray-300 mb-6 text-lg leading-relaxed">
            Experience seamless conversations powered by intelligent responses.
            Chat, learn, and explore new ideas all with the power of AI at your fingertips.
          </p>
          <Button
            variant="default"
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl"
            onClick={handleChatClick}
            disabled={loading}
          >
            {loading && <Spinner className="h-4 w-4 text-white" />}
            {loading ? "Connecting..." : "Let's Chat"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default HomePage;
