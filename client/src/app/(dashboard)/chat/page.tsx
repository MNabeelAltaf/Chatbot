"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

type Message = { type: "user" | "bot"; text: string };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ChatPage() {
    const searchParams = useSearchParams();
    const chat_token = searchParams.get("chat_token") || "";

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [limitReached, setLimitReached] = useState(false);

    useEffect(() => {
        const storedSettings = localStorage.getItem("settingsData");
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            setSettings(parsed);
            if (parsed.subscription_id === null && parsed.user_messages_limit <= 0) {
                setLimitReached(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!settings) return;
        getChat();
        getUserSettings();

    }, [settings]);


    const sendMessage = async () => {
        if (!input.trim() || limitReached) return;

        setMessages((prev) => [...prev, { type: "user", text: input }]);
        setLoading(true);

        try {
            const botAnswer = "Response from AI Bot";

            const res = await fetch(`${BASE_URL}/api/save-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: settings.user_id,
                    chat_token: chat_token,
                    question: input,
                    answer: botAnswer,
                }),
            });

            const data = await res.json();

            setMessages((prev) => [...prev, { type: "bot", text: botAnswer }]);

            if (!data.success || data.data.remaining_limit === 0) {
                setLimitReached(true);
            }


            if (data.data.remaining_limit !== undefined) {
                const updatedSettings = { ...settings, user_messages_limit: data.data.remaining_limit };
                setSettings(updatedSettings);
                localStorage.setItem("settingsData", JSON.stringify(updatedSettings));
            }
        } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, { type: "bot", text: "Error: something went wrong." }]);
        } finally {
            setInput("");
            setLoading(false);
        }
    };

    const getChat = async () => {
        try {
            if (!settings) return;

            const res = await fetch(`${BASE_URL}/api/get-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: settings.user_id,
                    chat_token: chat_token,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Update messages state
                setMessages(data.chats);
            } else {
                console.error("Failed to fetch chat:", data.error);
            }
        } catch (error) {
            console.error("Error fetching chat:", error);
        }
    };


    const getUserSettings = async () => {
        try {
            const storedSettings = localStorage.getItem("settingsData");
            if (!storedSettings) throw new Error("Settings not found in localStorage");

            const settings = JSON.parse(storedSettings);
            const chat_token = new URLSearchParams(window.location.search).get("chat_token") || "";

            const res = await fetch(`${BASE_URL}/api/settings/get-settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: settings.user_id,
                    chat_token,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // console.log("User settings:", data.data);
                localStorage.setItem("settingsData", JSON.stringify(data.data));
            } else {
                console.error("Failed to fetch settings:", data.error);
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    };


    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage();
    };

    if (!settings) return <div>Loading...</div>;

    return (


        <main className="flex flex-col items-center justify-center min-h-screen bg-[#101828] p-4">
            <div className="w-full max-w-3xl flex flex-col h-[80vh] shadow-lg rounded-xl overflow-hidden bg-[#1E293B]">

                {settings.subscription_id === null ? (
                    <Badge className="w-full mb-4 bg-red-900 text-white px-4 py-2">
                        You are not a subscriber
                    </Badge>
                ) : (
                    <Badge className="w-full mb-4 bg-green-600 text-white px-4 py-2">
                        You Subscribed
                    </Badge>
                )}

                {limitReached && (
                    <Badge className="w-full mb-2 bg-yellow-500 text-black px-4 py-2">
                        Free response limit reached! Subscribe to continue.
                    </Badge>
                )}


                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`max-w-[75%] px-4 py-2 rounded-xl break-words ${msg.type === "user"
                                ? "self-end bg-indigo-600 text-white rounded-br-none"
                                : "self-start bg-gray-700 text-white rounded-bl-none"
                                }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                </div>


                <div className="flex gap-2 border-t border-gray-600 p-3 bg-[#1E293B]">
                    <input
                        type="text"
                        className="flex-1 p-3 rounded-xl bg-[#101828] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ask something..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={loading || limitReached}
                    />
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
                        onClick={sendMessage}
                        disabled={loading || limitReached}
                    >
                        {loading ? "..." : "Send"}
                    </Button>
                </div>
            </div>
        </main>



    );
}
