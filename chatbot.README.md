# AI Chatbot Assistant for Hotels

## Overview

The AI Chatbot Assistant is an embedded widget on the hotel detail page that allows guests to ask natural‑language questions about a specific hotel.

It uses:

- A **chat UI** (floating button + modal)
- A **chat hook** for managing state
- A **backend Chat API** that calls a hotel‑aware RAG service:
  - `https://dashboard-hotelmanagement.vercel.app/api/chat`

---

## Features

- Floating chatbot button with glow animation
- Hotel intro popup on page load (optional)
- Chat modal with:
  - Message history (user + assistant)
  - Typing/“loading” indicator
  - Error message display
- API integration:
  - Sends `{ hotelId, question }` to Chat API
  - Displays `answer` from backend

---

## Architecture

### Client Side

- **ChatButton**
  - Floating bottom‑right button
  - Glowing, animated logo
  - Opens the chat modal when clicked

- **ChatModal**
  - Renders message list, input, send button
  - Shows typing indicator while waiting for API
  - Shows error text when API call fails
  - Auto‑scrolls to the latest message

- **ChatMessage**
  - Single chat bubble for either `user` or `assistant`
  - Different alignment and styling per role

- **HotelChatbot**
  - Orchestrator component
  - Props:
    - `hotelId`
    - `hotelName` (for display / context in UI)
  - Manages open/close state for chat
  - Uses `useChat` hook for logic
  - Renders `ChatButton` and `ChatModal`

- **HotelIntroPopup (optional)**
  - Onboarding‑style popup on hotel detail page load
  - Shows a short “What I can help you with” message near the chat area

### Hook: `useChat`

- Holds `messages`, `loading`, `error`
- Exposes `sendMessage`, `clearChat`, `messagesEndRef`
- Responsible for calling the backend Chat API and updating messages.

---

## Chat API Integration

### Endpoint

```text
POST https://dashboard-hotelmanagement.vercel.app/api/chat
```

### Request Body

```json
{
  "hotelId": 123,
  "question": "Does this hotel offer late checkout?"
}
```

### Response

```json
{
  "answer": "Late checkout is available until 2 PM, subject to availability and an extra fee."
}
```

### Client Logic (useChat)

```js
import { HOTELS_API } from "@/config/api";

const CHAT_API = `${HOTELS_API.externalBase}/api/chat`;

async function sendChatMessage(question, hotelId) {
  const payload = {
    question,
    hotelId: Number(hotelId),
  };

  const res = await fetch(CHAT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Request failed");
    throw new Error(err || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.answer ?? "";
}
```

`useChat` then:

- Appends a user message.
- Calls `sendChatMessage`.
- Appends the assistant message with the returned `answer`.
- Handles errors and shows a fallback message.

---

## Environment Variables

The chatbot uses the same base backend configuration as the main app:

```bash
NEXT_PUBLIC_API_BASE_URL=https://dashboard-hotelmanagement.vercel.app
```

The backend itself may require:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
```

> Client uses only the chat endpoint; secrets are managed by the backend.

---

## Usage Example

On the hotel detail page:

```jsx
export default function HotelDetailsPage() {
  // …fetch hotel data…

  const hotelId = id;        // from route param
  const hotelName = title;   // normalized name

  return (
    <>
      {/* existing hero, header, sections */}
      {/* ... */}

      {/* Optional intro popup */}
      <HotelIntroPopup
        titleText="Your AI Assistant — ask about policies, amenities, fees, or attractions"
        autoCloseTime={20000}
      />

      {/* Chatbot widget */}
      <HotelChatbot hotelId={hotelId} hotelName={hotelName} />
    </>
  );
}
```

---

## UX Behavior

- **Opening**
  - User clicks the floating ChatButton.
  - ChatModal appears, focused on input.
- **Sending**
  - User types a question and clicks **Send**.
  - Message is added to the chat.
  - Loader/typing indicator appears while waiting for the API.
  - Assistant response is appended when API returns.
- **Errors**
  - If the API call fails (network / 4xx / 5xx), an error banner appears and a friendly fallback assistant message is shown.
- **Closing**
  - User closes modal via the close icon.
  - ChatButton remains on screen to reopen the conversation.

---

## Best Practices

- Debounce user input at the UI level if you add streaming or type‑ahead.
- Cap message length on client and server (to control cost and latency).
- Add analytics (optional) to understand frequent questions per hotel.
- For production, consider:
  - Rate limiting `/api/chat` by IP/user.
  - Logging prompt/response metadata (without sensitive info) for monitoring.

