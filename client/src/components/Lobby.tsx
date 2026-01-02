import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export const Lobby = () => {
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then(setRooms)
      .catch(console.error);

    const interval = setInterval(() => {
      fetch("/api/rooms")
        .then((res) => res.json())
        .then(setRooms)
        .catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRoomName.trim() || uuidv4();
    navigate(`/room/${name}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          ShareCode
        </h1>

        <form onSubmit={handleCreateRoom} className="mb-8">
          <label className="block text-sm font-medium mb-2 text-gray-400">
            Create New Room
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room Name (Optional)"
              className="flex-1 bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>

        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">
            Active Rooms
          </h2>
          {rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No active rooms found.
            </p>
          ) : (
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room}>
                  <button
                    onClick={() => navigate(`/room/${room}`)}
                    className="w-full text-left bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded flex justify-between items-center transition-colors group"
                  >
                    <span className="font-medium">{room}</span>
                    <span className="text-gray-500 group-hover:text-blue-400">
                      &rarr;
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
