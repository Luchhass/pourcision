# Pourcision Multiplayer Backend

Socket.IO backend for Pourcision rooms.

## Local

```bash
cd server
npm install
npm run dev
```

Default URL: `http://localhost:4000`

Frontend env:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Events

- `room:create`
- `room:join`
- `room:getState`
- `room:updateSettings`
- `room:leave`
- `room:kickPlayer`
- `room:startGame`
- `room:returnToLobby`
- `game:submitGuess`

Server emits `room:state`, `game:started`, `game:submissionReceived`, and `game:scoreboard`.
