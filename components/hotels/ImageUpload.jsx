"use client";

import { Add, Delete } from "@mui/icons-material";
import { calculatePoints } from "../utils/prices";

export default function RoomsSection({ rooms, onChange }) {

  /* =========================
     ROOM FUNCTIONS
  ========================== */

  const handleAddRoom = () => {
    onChange([
      ...rooms,
      {
        room_type: "",
        bedding: "",
        view: "",
        capacity: 2,
        images: [],
        packages: [],
      },
    ]);
  };

  const handleRemoveRoom = (index) => {
    onChange(rooms.filter((_, i) => i !== index));
  };

  const handleRoomChange = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    onChange(updated);
  };

  /* =========================
     IMAGE UPLOAD (Multiple)
  ========================== */

  const handleImageUpload = (roomIndex, files) => {
    const updated = [...rooms];
    const imageUrls = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    updated[roomIndex].images = [
      ...updated[roomIndex].images,
      ...imageUrls,
    ];

    onChange(updated);
  };

  const handleRemoveImage = (roomIndex, imageIndex) => {
    const updated = [...rooms];
    updated[roomIndex].images.splice(imageIndex, 1);
    onChange(updated);
  };

  /* =========================
     PACKAGE FUNCTIONS
  ========================== */

  const handleAddPackage = (roomIndex) => {
    const updated = [...rooms];
    updated[roomIndex].packages.push({
      meal_board: "",
      cancellation_policy: "",
      first_price: "",
      base_price: "",
      almosafer_points: 0,
      shukran_points: 0,
    });
    onChange(updated);
  };

  const handleRemovePackage = (roomIndex, pkgIndex) => {
    const updated = [...rooms];
    updated[roomIndex].packages.splice(pkgIndex, 1);
    onChange(updated);
  };

  const handlePackageChange = (roomIndex, pkgIndex, field, value) => {
    const updated = [...rooms];
    const pkg = updated[roomIndex].packages[pkgIndex];

    pkg[field] = value;

    if (field === "base_price") {
      const { almosafer_points, shukran_points } =
        calculatePoints(Number(value));

      pkg.almosafer_points = almosafer_points;
      pkg.shukran_points = shukran_points;
    }

    onChange(updated);
  };

  const generateRoomTitle = (room) => {
    if (!room.room_type || !room.bedding || !room.view)
      return "Configure room details";
    return `${room.room_type} - ${room.bedding} (${room.view})`;
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Rooms</h2>
          <p className="text-sm text-gray-500">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} added
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddRoom}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Add fontSize="small" />
          Add Room
        </button>
      </div>

      {/* ROOM LIST */}
      {rooms.map((room, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 relative space-y-6"
        >

          {/* REMOVE ROOM */}
          <button
            onClick={() => handleRemoveRoom(index)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
          >
            <Delete />
          </button>

          {/* TITLE */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {generateRoomTitle(room)}
            </h3>
            <p className="text-sm text-gray-500">
              Room #{index + 1}
            </p>
          </div>

          {/* ROOM OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <select
              value={room.room_type}
              onChange={(e) =>
                handleRoomChange(index, "room_type", e.target.value)
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Room Type</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
            </select>

            <select
              value={room.bedding}
              onChange={(e) =>
                handleRoomChange(index, "bedding", e.target.value)
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Bedding</option>
              <option value="King Bed">King Bed</option>
              <option value="Queen Bed">Queen Bed</option>
              <option value="Twin Beds">Twin Beds</option>
            </select>

            <select
              value={room.view}
              onChange={(e) =>
                handleRoomChange(index, "view", e.target.value)
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">View</option>
              <option value="Balcony View">Balcony View</option>
              <option value="Canal View">Canal View</option>
              <option value="City View">City View</option>
            </select>
          </div>

          {/* CAPACITY */}
          <input
            type="number"
            value={room.capacity}
            onChange={(e) =>
              handleRoomChange(index, "capacity", e.target.value)
            }
            placeholder="Capacity"
            className="border rounded-xl px-3 py-2 text-sm w-40"
          />

          {/* =========================
             IMAGE UPLOAD SECTION
          ========================== */}

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800">
                Room Images
              </h4>
            </div>

            <input
              type="file"
              multiple
              onChange={(e) =>
                handleImageUpload(index, e.target.files)
              }
              className="mb-3"
            />

            <div className="flex flex-wrap gap-3">
              {room.images.map((img, imgIndex) => (
                <div key={imgIndex} className="relative">
                  <img
                    src={img}
                    alt="room"
                    className="w-28 h-28 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveImage(index, imgIndex)
                    }
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                  >
                    <Delete fontSize="small" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* =========================
             PACKAGES SECTION
          ========================== */}

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">
                Packages
              </h4>
              <button
                type="button"
                onClick={() => handleAddPackage(index)}
                className="text-sm text-blue-600 font-medium"
              >
                + Add Package
              </button>
            </div>

            {room.packages.map((pkg, pkgIndex) => (
              <div
                key={pkgIndex}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3 relative"
              >

                {/* DELETE PACKAGE */}
                <button
                  type="button"
                  onClick={() =>
                    handleRemovePackage(index, pkgIndex)
                  }
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                >
                  <Delete fontSize="small" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                  <select
                    value={pkg.meal_board}
                    onChange={(e) =>
                      handlePackageChange(index, pkgIndex, "meal_board", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Meal Board</option>
                    <option value="RO">RO</option>
                    <option value="BB">BB</option>
                    <option value="HB">HB</option>
                    <option value="FB">FB</option>
                  </select>

                  <select
                    value={pkg.cancellation_policy}
                    onChange={(e) =>
                      handlePackageChange(index, pkgIndex, "cancellation_policy", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cancellation</option>
                    <option value="Refundable">Refundable</option>
                    <option value="Non-refundable">Non-refundable</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Original Price"
                    value={pkg.first_price}
                    onChange={(e) =>
                      handlePackageChange(index, pkgIndex, "first_price", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    placeholder="Discounted Price"
                    value={pkg.base_price}
                    onChange={(e) =>
                      handlePackageChange(index, pkgIndex, "base_price", e.target.value)
                    }
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="text-xs text-gray-600 pt-2 border-t">
                  🎁 {pkg.almosafer_points} Almosafer points •{" "}
                  {pkg.shukran_points} Shukran points
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}