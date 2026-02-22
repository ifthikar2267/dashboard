"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Typography,
  Button,
  Box,
  Stack,
} from "@mui/material";
import {
  Bed as BedIcon,
  People as PeopleIcon,
  LocalOffer as PointsIcon,
} from "@mui/icons-material";
import { generateRoomTitle } from "@/components/utils/rooms";

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

function formatPrice(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function priceDropPercent(firstPrice, basePrice) {
  const first = Number(firstPrice) || 0;
  const base = Number(basePrice) || 0;
  if (first <= 0 || base >= first) return 0;
  return Math.round(((first - base) / first) * 100);
}

function mealBoardLabel(code) {
  const map = {
    RO: "Room Only",
    BB: "Bed & Breakfast",
    HB: "Half Board",
    FB: "Full Board",
  };
  return map[code] || code || "";
}

/**
 * Single room card in Almosafer OTA style.
 * @param {Object} room - { images?, room_type, bedding, view, capacity?, packages? }
 */
export default function RoomCard({ room }) {
  if (!room) return null;

  const title = generateRoomTitle(room) || "Room";
  const images = safeArray(room.images);
  const coverImage = images[0] || "https://via.placeholder.com/400x220?text=Room";
  const capacity = room.capacity != null ? room.capacity : 2;
  const packages = safeArray(room.packages);

  return (
    <Card variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
      <Grid container>
        {/* Left: Room Image */}
        <Grid item xs={12} md={4}>
          <CardMedia
            component="img"
            height="220"
            image={coverImage}
            alt={title}
            sx={{ objectFit: "cover" }}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x220?text=No+Image";
            }}
          />
        </Grid>

        {/* Center + Right: Content */}
        <Grid item xs={12} md={8}>
          <CardContent sx={{ p: 2.5 }}>
            {/* Top: Room title, capacity, bedding, "More room info" */}
            <Box mb={2}>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                {title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <Chip
                  size="small"
                  icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                  label={`${capacity} Adults`}
                  variant="outlined"
                />
                {room.bedding && (
                  <Chip
                    size="small"
                    icon={<BedIcon sx={{ fontSize: 16 }} />}
                    label={room.bedding}
                    variant="outlined"
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                More room info
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              Select an option
            </Typography>

            {/* Package rows */}
            {packages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No packages available
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {packages.map((pkg, idx) => {
                  const firstPrice = pkg.first_price;
                  const basePrice = pkg.base_price;
                  const drop = priceDropPercent(firstPrice, basePrice);
                  const almosafer = pkg.almosafer_points ?? 0;
                  const shukran = pkg.shukran_points ?? 0;

                  return (
                    <Card
                      key={idx}
                      variant="outlined"
                      sx={{
                        bgcolor: "grey.50",
                        borderColor: "divider",
                        "&:hover": { borderColor: "primary.light" },
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                        <Grid container alignItems="center" spacing={2}>
                          {/* Left: Meal board, cancellation, points */}
                          <Grid item xs={12} md={5}>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {mealBoardLabel(pkg.meal_board)}
                              </Typography>
                              {pkg.cancellation_policy && (
                                <Typography variant="body2" color="text.secondary">
                                  {pkg.cancellation_policy}
                                </Typography>
                              )}
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                                <PointsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="caption" color="text.secondary">
                                  {almosafer > 0 && (
                                    <span>
                                      <strong>{almosafer}</strong> Almosafer points
                                    </span>
                                  )}
                                  {almosafer > 0 && shukran > 0 && " or "}
                                  {shukran > 0 && (
                                    <span>
                                      <strong>{shukran}</strong> Shukrans
                                    </span>
                                  )}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Grid>

                          {/* Middle: Fits X Adults */}
                          <Grid item xs={12} md={2}>
                            <Typography variant="body2" color="text.secondary">
                              Fits {capacity}
                            </Typography>
                          </Grid>

                          {/* Right: Prices + Book Now */}
                          <Grid item xs={12} md={5}>
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2} flexWrap="wrap">
                              <Box textAlign="right">
                                {Number(firstPrice) > Number(basePrice) && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ textDecoration: "line-through" }}
                                  >
                                    {formatPrice(firstPrice)}
                                  </Typography>
                                )}
                                <Typography variant="h6" fontWeight={800}>
                                  {formatPrice(basePrice)}
                                </Typography>
                                {drop > 0 && (
                                  <Chip
                                    size="small"
                                    label={`Price dropped ${drop}%`}
                                    color="success"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                              <Button
                                variant="contained"
                                color="error"
                                size="medium"
                                sx={{ minWidth: 120 }}
                              >
                                Book Now
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
}
