"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  createHotel,
  saveHotelImageUrls,
  saveHotelRooms,
  saveHotelAmenities,
  saveHotelReviewAggregates,
} from "@/lib/services/hotels.service";
import {
  getTypes,
  getChains,
  getAreas,
} from "@/lib/services/masterData.service";

// Lazy load heavy components
const ImageUrlInput = lazy(() => import("@/components/hotels/ImageUrlInput"));
const AmenitiesSection = lazy(
  () => import("@/components/hotels/AmenitiesSection"),
);
const FAQSection = lazy(() => import("@/components/hotels/FAQSection"));
const RoomsSection = lazy(() => import("@/components/hotels/RoomsSection"));
const ReviewAggregatesSection = lazy(
  () => import("@/components/hotels/ReviewAggregatesSection"),
);

// Loading component for lazy loaded sections
const SectionLoader = () => (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <p className="text-sm text-gray-500 mt-2">Loading section...</p>
  </div>
);

export default function AddHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [canSubmit, setCanSubmit] = useState(true); // Prevent accidental submission after navigation
  const [errors, setErrors] = useState({ basic: {}, rooms: [], faqs: [] });

  // Form data
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    type_id: "",
    chain_id: "",
    area_id: "",
    address_en: "",
    address_ar: "",
    star_rating: "",
    rank: "",
    description_en: "",
    description_ar: "",
    thumbnail_url: "",
    status: "active",
  });

  // Dynamic sections
  const [imageUrls, setImageUrls] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [faqs, setFAQs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reviewAggregates, setReviewAggregates] = useState([]);

  // Master data
  const [types, setTypes] = useState([]);
  const [chains, setChains] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const filteredAreas = areas.filter((area) =>
    area.name_en.toLowerCase().includes(areaSearch.toLowerCase()),
  );

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      // Fetch only active master data for dropdowns
      const [typesResult, chainsResult, areasResult] = await Promise.all([
        getTypes(true), // activeOnly = true
        getChains(true), // activeOnly = true
        getAreas(true), // activeOnly = true
      ]);

      setTypes(typesResult.data || []);
      setChains(chainsResult.data || []);
      setAreas(areasResult.data || []);
    } catch (err) {
      console.error("Error loading master data:", err);
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for that specific field when user types
    if (errors.basic?.[name]) {
      setErrors((prev) => ({
        ...prev,
        basic: {
          ...prev.basic,
          [name]: false,
        },
      }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setShowAreaDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {
      basic: {},
      rooms: [],
      faqs: [],
    };

    // ===== BASIC INFO =====
    if (!formData.name_en) newErrors.basic.name_en = true;
    if (!formData.name_ar) newErrors.basic.name_ar = true;
    if (!formData.type_id) newErrors.basic.type_id = true;
    if (!formData.area_id) newErrors.basic.area_id = true;
    if (!formData.star_rating) newErrors.basic.star_rating = true;
    if (!formData.rank && formData.rank !== 0) {
      newErrors.basic.rank = true;
    }
    if (!formData.address_en) newErrors.basic.address_en = true;
    if (!formData.address_ar) newErrors.basic.address_ar = true;
    if (!formData.thumbnail_url?.trim()) {
      newErrors.basic.thumbnail_url = true;
    }

    if (Object.keys(newErrors.basic).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill required basic information");
      setActiveSection("basic");
      return false;
    }

    // ===== ROOMS =====
    if (rooms.length > 0) {
      newErrors.rooms = rooms.map((room) => {
        const roomError = {};

        if (!room.room_type) roomError.room_type = true;
        if (!room.bedding) roomError.bedding = true;
        if (!room.view) roomError.view = true;

        if (!Array.isArray(room.packages) || room.packages.length === 0) {
          roomError.packages = true;
        }

        return roomError;
      });

      const hasRoomErrors = newErrors.rooms.some(
        (room) => Object.keys(room).length > 0,
      );

      if (hasRoomErrors) {
        setErrors(newErrors);
        toast.error("Please complete room details");
        setActiveSection("rooms");
        return false;
      }
    }

    // ===== FAQ =====
    if (faqs.length > 0) {
      newErrors.faqs = faqs.map((faq) => {
        const faqError = {};
        if (!faq.question_en) faqError.question_en = true;
        if (!faq.answer_en) faqError.answer_en = true;
        return faqError;
      });

      const hasFaqErrors = newErrors.faqs.some(
        (faq) => Object.keys(faq).length > 0,
      );

      if (hasFaqErrors) {
        setErrors(newErrors);
        toast.error("Please fill all FAQ fields");
        setActiveSection("faq");
        return false;
      }
    }

    setErrors({
      basic: {},
      rooms: [],
      faqs: [],
    });

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(
      "handleSubmit called - activeSection:",
      activeSection,
      "canSubmit:",
      canSubmit,
    );

    // Only allow submission from the Rooms section
    if (activeSection !== "rooms") {
      console.log("Form submission blocked - not on Rooms section");
      return;
    }

    // Prevent accidental submission right after navigation
    if (!canSubmit) {
      console.log(
        "Form submission blocked - canSubmit is false (cooldown active)",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Convert string values to numbers for foreign keys
      const hotelData = {
        ...formData,
        type_id: parseInt(formData.type_id),
        chain_id: formData.chain_id ? parseInt(formData.chain_id) : null,
        area_id: parseInt(formData.area_id),
        star_rating: formData.star_rating
          ? parseInt(formData.star_rating)
          : null,
        rank: parseInt(formData.rank) || 0,
      };

      // Create hotel
      const { data: hotel, error } = await createHotel(hotelData);

      if (error) {
        toast.error("Failed to create hotel: " + error);
        setSubmitting(false);
        return;
      }

      // Save image URLs if any
      if (imageUrls.length > 0 && hotel?.id) {
        const { error: imageError } = await saveHotelImageUrls(
          hotel.id,
          imageUrls,
        );

        if (imageError) {
          console.error("Failed to save image URLs:", imageError);
          toast.error("Hotel created but images failed to save");
        }
      }

      // Save amenities if any
      if (amenities.length > 0 && hotel?.id) {
        console.log("Saving amenities:", amenities);
        const { error: amenitiesError } = await saveHotelAmenities(
          hotel.id,
          amenities,
        );

        if (amenitiesError) {
          console.error("Failed to save amenities:", amenitiesError);
          toast.error("Hotel created but amenities failed to save");
        }
      }

      // Save rooms/prices if any
      if (rooms.length > 0 && hotel?.id) {
        const { error: roomsError } = await saveHotelRooms(hotel.id, rooms);
        if (roomsError) {
          console.error("Failed to save rooms:", roomsError);
          toast.error("Hotel created but rooms failed to save");
        }
      }

      if (reviewAggregates.length > 0 && hotel?.id) {
        const validReviews = reviewAggregates.filter(
          (r) => r && r.average_rating !== undefined && r.average_rating !== null
        );
        if (validReviews.length > 0) {
          const { error: reviewsError } = await saveHotelReviewAggregates(
            hotel.id,
            validReviews,
          );
          if (reviewsError) {
            console.error("Failed to save review aggregates:", reviewsError);
            toast.error("Hotel created but review aggregates failed to save");
          }
        }
      }

      // Show success message
      toast.success("Hotel created successfully with all details!");

      setTimeout(() => {
        router.push("/dashboard/hotels");
      }, 1000);
    } catch (err) {
      console.error("Error creating hotel:", err);
      toast.error("Failed to create hotel");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked");
    router.push("/dashboard/hotels");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "basic", label: "General Info", icon: "📝" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "amenities", label: "Amenities", icon: "✨" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "rooms", label: "Rooms & Pricing", icon: "🛏️" },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
        <p className="text-gray-600 mt-1">
          Create a new property with content, pricing, images, amenities, and
          reviews to make it available for booking.{" "}
        </p>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  console.log("Tab clicked:", section.id);
                  setActiveSection(section.id);
                }}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer
                  ${
                    activeSection === section.id
                      ? "text-blue-600 border-blue-600 cursor-pointer"
                      : "text-gray-600 hover:text-gray-900 hover:border-gray-300 border-transparent cursor-pointer"
                  }
                `}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6"
          onKeyDown={(e) => {
            // Prevent ALL form submissions via Enter key
            // Only allow explicit button clicks
            if (e.key === "Enter") {
              e.preventDefault();
              console.log("Enter key pressed - prevented default submission");
            }
          }}
        >
          {/* Basic Information */}
          {activeSection === "basic" && (
            <div className="space-y-6">
              <div>
                {/* <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2> */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Name (EN) *
                    </label>
                    <input
                      type="text"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleChange}
                      placeholder="Enter hotel name in English"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.name_en
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Name (AR) *
                    </label>
                    <input
                      type="text"
                      name="name_ar"
                      value={formData.name_ar}
                      onChange={handleChange}
                      placeholder="Enter hotel name in Arabic"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.name_ar
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      dir="rtl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="type_id"
                      value={formData.type_id}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer
    ${
      errors.basic?.type_id
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      required
                    >
                      <option value="">Select </option>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chain
                    </label>
                    <select
                      name="chain_id"
                      value={formData.chain_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Select</option>
                      {chains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area *
                    </label>

                    <input
                      type="text"
                      value={areaSearch}
                      onChange={(e) => {
                        setAreaSearch(e.target.value);
                        setShowAreaDropdown(true);

                        // Clear selected area if user edits
                        setFormData((prev) => ({
                          ...prev,
                          area_id: "",
                        }));
                      }}
                      onFocus={() => setShowAreaDropdown(true)}
                      placeholder="Search area..."
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer
      ${
        errors.basic?.area_id
          ? "border-red-300 focus:ring-red-500"
          : "border-gray-300 focus:ring-blue-500"
      }`}
                    />

                    {showAreaDropdown && filteredAreas.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {filteredAreas.map((area) => (
                          <div
                            key={area.id}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                area_id: area.id,
                              }));

                              setAreaSearch(area.name_en);
                              setShowAreaDropdown(false);

                              // Clear error
                              setErrors((prev) => ({
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  area_id: false,
                                },
                              }));
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                          >
                            {area.name_en}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Star Rating *
                    </label>
                    <select
                      name="star_rating"
                      value={formData.star_rating}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer
    ${
      errors.basic?.star_rating
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rank *
                    </label>
                    <input
                      type="number"
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      required
                      placeholder="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.rank
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) =>
                        ["ArrowUp", "ArrowDown"].includes(e.key) &&
                        e.preventDefault()
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address (EN) *
                    </label>
                    <input
                      type="text"
                      name="address_en"
                      value={formData.address_en}
                      required
                      onChange={handleChange}
                      placeholder="Enter address in English"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.address_en
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address (AR) *
                    </label>
                    <input
                      type="text"
                      name="address_ar"
                      value={formData.address_ar}
                      onChange={handleChange}
                      placeholder="Enter address in Arabic"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.address_ar
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Description
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (EN)
                    </label>
                    <textarea
                      name="description_en"
                      value={formData.description_en}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Enter hotel description in English"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (AR)
                    </label>
                    <textarea
                      name="description_ar"
                      value={formData.description_ar}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Enter hotel description in Arabic"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="rtl"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail Image URL *
                    </label>
                    <input
                      type="url"
                      name="thumbnail_url"
                      value={formData.thumbnail_url}
                      required
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
    ${
      errors.basic?.thumbnail_url
        ? "border-red-300 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Enter a URL for the hotel thumbnail image
                    </p>
                    {formData.thumbnail_url && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Preview:
                        </p>
                        <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={formData.thumbnail_url}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "";
                              e.target.alt = "Invalid image URL";
                              e.target.className =
                                "w-full h-full flex items-center justify-center text-xs text-gray-400";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Images Section */}
          {activeSection === "images" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Hotel Images
              </h2>
              <Suspense fallback={<SectionLoader />}>
                <ImageUrlInput imageUrls={imageUrls} onChange={setImageUrls} />
              </Suspense>
            </div>
          )}

          {/* Amenities Section */}
          {activeSection === "amenities" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Amenities
              </h2>
              <Suspense fallback={<SectionLoader />}>
                <AmenitiesSection
                  selectedAmenities={amenities}
                  onChange={setAmenities}
                />
              </Suspense>
            </div>
          )}

          {/* FAQ Section */}
          {activeSection === "faq" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <Suspense fallback={<SectionLoader />}>
                <FAQSection faqs={faqs} onChange={setFAQs} />
              </Suspense>
            </div>
          )}

          {/* Reviews Section */}
          {activeSection === "reviews" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews
              </h2>
              <Suspense fallback={<SectionLoader />}>
                <ReviewAggregatesSection
                  reviews={reviewAggregates}
                  onChange={setReviewAggregates}
                />
              </Suspense>
            </div>
          )}

          {/* Rooms Section */}
          {activeSection === "rooms" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rooms & Pricing
              </h2>
              <Suspense fallback={<SectionLoader />}>
                <RoomsSection rooms={rooms} onChange={setRooms} />
              </Suspense>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {activeSection !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection,
                    );
                    if (currentIndex > 0) {
                      setActiveSection(sections[currentIndex - 1].id);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Previous
                </button>
              )}
              {activeSection !== "rooms" ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "Next button clicked from section:",
                      activeSection,
                    );
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection,
                    );
                    if (currentIndex < sections.length - 1) {
                      const nextSection = sections[currentIndex + 1].id;
                      console.log("Navigating to:", nextSection);
                      setActiveSection(nextSection);

                      // If navigating to Rooms section, add a brief cooldown to prevent accidental submission
                      if (nextSection === "rooms") {
                        setCanSubmit(false);
                        setTimeout(() => {
                          console.log("Submit cooldown ended - can submit now");
                          setCanSubmit(true);
                        }, 500); // 500ms cooldown
                      }
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Hotel"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
