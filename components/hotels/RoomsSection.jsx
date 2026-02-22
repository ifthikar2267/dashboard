"use client";

import { useCallback } from "react";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

const ROOM_TYPES = ["Standard", "Deluxe"];
const BEDDING_OPTIONS = ["King Bed", "Queen Bed", "Twin Beds"];
const VIEW_OPTIONS = ["Balcony View", "Canal View"];
const MEAL_BOARDS = [
  { value: "RO", label: "Room Only" },
  { value: "BB", label: "Bed & Breakfast" },
  { value: "HB", label: "Half Board" },
  { value: "FB", label: "Full Board" },
];
const CANCELLATION_OPTIONS = ["Refundable", "Non-refundable"];

const ALMOSAFER_RATE = 0.1;
const SHUKRAN_RATE = 0.2;

function safeArray(val) {
  return Array.isArray(val) ? [...val] : [];
}

function ensureStringArray(val) {
  if (!Array.isArray(val)) return [];
  return val.filter((item) => typeof item === "string" && item.trim() !== "");
}

function emptyRoom() {
  return {
    room_type: "",
    bedding: "",
    view: "",
    images: [],
    imageUrlDraft: "",
    packages: [],
  };
}

function emptyPackage() {
  return {
    meal_board: "",
    cancellation_policy: "",
    first_price: "",
    base_price: "",
    almosafer_points: 0,
    shukran_points: 0,
  };
}

function formatRoomTitle(room) {
  const r = room || {};
  const rt = r.room_type || "";
  const b = r.bedding || "";
  const v = r.view || "";
  if (!rt || !b || !v) return "Configure room details";
  return `${rt} - ${b} (${v})`;
}

function calcPointsFromBase(basePrice) {
  const base = Number(parseFloat(basePrice) || 0);
  return {
    almosafer_points: Number((base * ALMOSAFER_RATE).toFixed(2)),
    shukran_points: Number((base * SHUKRAN_RATE).toFixed(2)),
  };
}

export default function RoomsSection({ rooms = [], onChange }) {
  const list = safeArray(rooms);

  const update = useCallback(
    (next) => {
      if (typeof onChange === "function") {
        onChange(safeArray(next));
      }
    },
    [onChange],
  );

  const addRoom = useCallback(() => {
    update([...list, emptyRoom()]);
  }, [list, update]);

  const removeRoom = useCallback(
    (idx) => {
      if (idx < 0 || idx >= list.length) return;
      update(list.filter((_, i) => i !== idx));
    },
    [list, update],
  );

  const setRoomField = useCallback(
    (roomIdx, field, value) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, [field]: value }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  const addImage = useCallback(
    (roomIdx) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const room = list[roomIdx] || emptyRoom();
      const draft = String(room.imageUrlDraft || "").trim();
      if (!draft) return;
      const currentImages = ensureStringArray(room.images);
      const nextImages = [...currentImages, draft];
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, images: nextImages, imageUrlDraft: "" }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  const removeImage = useCallback(
    (roomIdx, imgIdx) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const room = list[roomIdx] || emptyRoom();
      const currentImages = ensureStringArray(room.images);
      if (imgIdx < 0 || imgIdx >= currentImages.length) return;
      const nextImages = currentImages.filter((_, i) => i !== imgIdx);
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, images: nextImages }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  const addPackage = useCallback(
    (roomIdx) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const room = list[roomIdx] || emptyRoom();
      const packages = safeArray(room.packages);
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, packages: [...packages, emptyPackage()] }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  const removePackage = useCallback(
    (roomIdx, pkgIdx) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const room = list[roomIdx] || emptyRoom();
      const packages = safeArray(room.packages);
      if (pkgIdx < 0 || pkgIdx >= packages.length) return;
      const nextPackages = packages.filter((_, i) => i !== pkgIdx);
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, packages: nextPackages }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  const setPackageField = useCallback(
    (roomIdx, pkgIdx, field, value) => {
      if (roomIdx < 0 || roomIdx >= list.length) return;
      const room = list[roomIdx] || emptyRoom();
      const packages = safeArray(room.packages);
      if (pkgIdx < 0 || pkgIdx >= packages.length) return;
      const pkg = { ...emptyPackage(), ...packages[pkgIdx], [field]: value };
      if (field === "base_price") {
        const points = calcPointsFromBase(value);
        pkg.almosafer_points = points.almosafer_points;
        pkg.shukran_points = points.shukran_points;
      }
      const nextPackages = packages.map((p, i) =>
        i === pkgIdx ? pkg : { ...emptyPackage(), ...p },
      );
      const next = list.map((r, i) =>
        i === roomIdx
          ? { ...emptyRoom(), ...r, packages: nextPackages }
          : { ...emptyRoom(), ...r },
      );
      update(next);
    },
    [list, update],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h6" fontWeight={700}>
            Rooms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {list.length} room{list.length !== 1 ? "s" : ""} added
          </Typography>
        </div>
        <Button
          type="button"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addRoom}
          fullWidth
          sx={{
            maxWidth: { sm: 200 },
            backgroundColor: "#2563eb",
            "&:hover": {
              backgroundColor: "#1d4ed8",
            },
          }}
        >
          Add Room
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {list.map((room, roomIdx) => {
          const roomSafe = { ...emptyRoom(), ...room };
          const title = formatRoomTitle(roomSafe);
          const images = ensureStringArray(roomSafe.images);
          const packages = safeArray(roomSafe.packages);

          return (
            <Card key={roomIdx} variant="outlined" sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-row justify-between items-start gap-2">
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      className="min-w-0 flex-1"
                    >
                      {title}
                    </Typography>
                    <IconButton
                      type="button"
                      color="error"
                      size="small"
                      onClick={() => removeRoom(roomIdx)}
                      aria-label="Remove room"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>

                  <section aria-label="Room configuration">
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      Room configuration
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormControl fullWidth size="small">
                        <InputLabel id={`room-type-${roomIdx}`}>
                          Room Type
                        </InputLabel>
                        <Select
                          labelId={`room-type-${roomIdx}`}
                          label="Room Type"
                          value={roomSafe.room_type || ""}
                          onChange={(e) =>
                            setRoomField(roomIdx, "room_type", e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {ROOM_TYPES.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`room-bedding-${roomIdx}`}>
                          Bedding
                        </InputLabel>
                        <Select
                          labelId={`room-bedding-${roomIdx}`}
                          label="Bedding"
                          value={roomSafe.bedding || ""}
                          onChange={(e) =>
                            setRoomField(roomIdx, "bedding", e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {BEDDING_OPTIONS.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`room-view-${roomIdx}`}>
                          View
                        </InputLabel>
                        <Select
                          labelId={`room-view-${roomIdx}`}
                          label="View"
                          value={roomSafe.view || ""}
                          onChange={(e) =>
                            setRoomField(roomIdx, "view", e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {VIEW_OPTIONS.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </section>

                  <section aria-label="Image management">
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 1.5 }}
                    >
                      Images
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2">
                        <TextField
                          fullWidth
                          size="small"
                          label="Paste Image URL"
                          placeholder="https://example.com/room.jpg"
                          value={roomSafe.imageUrlDraft || ""}
                          onChange={(e) =>
                            setRoomField(
                              roomIdx,
                              "imageUrlDraft",
                              e.target.value,
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addImage(roomIdx);
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addImage(roomIdx)}
                        sx={{
                          color: "#2563eb",
                          borderColor: "#2563eb",
                          "&:hover": {
                            borderColor: "#1d4ed8",   // blue-700
                            backgroundColor: "rgba(37, 99, 235, 0.08)", // light blue hover
                          },
                        }}
                      >
                        Add Image
                      </Button>
                    </div>
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {images.map((url, imgIdx) => (
                          <div
                            key={`${roomIdx}-${imgIdx}-${url.slice(0, 30)}`}
                            className="relative rounded overflow-hidden border border-gray-200 bg-gray-100"
                            style={{ paddingTop: "75%" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Room ${imgIdx + 1}`}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="Remove image"
                              onClick={() => removeImage(roomIdx, imgIdx)}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "background.paper",
                                "&:hover": { bgcolor: "background.paper" },
                                boxShadow: 1,
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section aria-label="Package pricing">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <Typography variant="subtitle2" fontWeight={600}>
                        Packages
                      </Typography>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addPackage(roomIdx)}
                        sx={{color: "#2563eb"}}
                      >
                        Add Package
                      </Button>
                    </div>
                    {packages.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Add at least one package (meal board, cancellation,
                        first price, base price).
                      </Typography>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {packages.map((pkg, pkgIdx) => {
                          const pkgSafe = { ...emptyPackage(), ...pkg };
                          return (
                            <Card
                              key={pkgIdx}
                              variant="outlined"
                              sx={{ bgcolor: "grey.50" }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-row justify-between items-center">
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={700}
                                    >
                                      Package {pkgIdx + 1}
                                    </Typography>
                                    <IconButton
                                      type="button"
                                      color="error"
                                      size="small"
                                      onClick={() =>
                                        removePackage(roomIdx, pkgIdx)
                                      }
                                      aria-label="Remove package"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormControl fullWidth size="small">
                                      <InputLabel
                                        id={`pkg-meal-${roomIdx}-${pkgIdx}`}
                                      >
                                        Meal Board
                                      </InputLabel>
                                      <Select
                                        labelId={`pkg-meal-${roomIdx}-${pkgIdx}`}
                                        label="Meal Board"
                                        value={pkgSafe.meal_board || ""}
                                        onChange={(e) =>
                                          setPackageField(
                                            roomIdx,
                                            pkgIdx,
                                            "meal_board",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <MenuItem value="">
                                          <em>Select</em>
                                        </MenuItem>
                                        {MEAL_BOARDS.map((opt) => (
                                          <MenuItem
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                      <InputLabel
                                        id={`pkg-cancel-${roomIdx}-${pkgIdx}`}
                                      >
                                        Cancellation Policy
                                      </InputLabel>
                                      <Select
                                        labelId={`pkg-cancel-${roomIdx}-${pkgIdx}`}
                                        label="Cancellation Policy"
                                        value={
                                          pkgSafe.cancellation_policy || ""
                                        }
                                        onChange={(e) =>
                                          setPackageField(
                                            roomIdx,
                                            pkgIdx,
                                            "cancellation_policy",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <MenuItem value="">
                                          <em>Select</em>
                                        </MenuItem>
                                        {CANCELLATION_OPTIONS.map((v) => (
                                          <MenuItem key={v} value={v}>
                                            {v}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="First Price"
                                      type="number"
                                      inputProps={{ min: 0, step: 0.01 }}
                                      value={pkgSafe.first_price ?? ""}
                                      onChange={(e) =>
                                        setPackageField(
                                          roomIdx,
                                          pkgIdx,
                                          "first_price",
                                          e.target.value,
                                        )
                                      }
                                      onWheel={(e) => e.target.blur()}
                                      onKeyDown={(e) =>
                                        ["ArrowUp", "ArrowDown"].includes(
                                          e.key,
                                        ) && e.preventDefault()
                                      }
                                    />
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Seling Price"
                                      type="number"
                                      inputProps={{ min: 0, step: 0.01 }}
                                      value={pkgSafe.base_price ?? ""}
                                      onChange={(e) =>
                                        setPackageField(
                                          roomIdx,
                                          pkgIdx,
                                          "base_price",
                                          e.target.value,
                                        )
                                      }
                                      onWheel={(e) => e.target.blur()}
                                      onKeyDown={(e) =>
                                        ["ArrowUp", "ArrowDown"].includes(
                                          e.key,
                                        ) && e.preventDefault()
                                      }
                                    />
                                  </div>
                                  <Box
                                    sx={{
                                      pt: 1.5,
                                      borderTop: 1,
                                      borderColor: "divider",
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Almosafer points:{" "}
                                      <strong>
                                        {pkgSafe.almosafer_points ?? 0}
                                      </strong>
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Shukran points:{" "}
                                      <strong>
                                        {pkgSafe.shukran_points ?? 0}
                                      </strong>
                                    </Typography>
                                  </Box>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
