/**
 * Generate room title from structured attributes (dynamic, not stored in DB).
 * @param {{ room_type?: string, bedding?: string, view?: string }} room
 * @returns {string}
 */
export function generateRoomTitle(room) {
  if (!room || !room.room_type || !room.bedding || !room.view) {
    return '';
  }
  return `${room.room_type} - ${room.bedding} (${room.view})`;
}
