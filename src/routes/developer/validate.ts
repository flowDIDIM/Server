import { createApp } from "@/lib/create-app";
import { validator } from "hono-openapi";
import { z } from "zod";

const PackageValidationSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
});

const TrackValidationSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  trackId: z.string().min(1, "Track ID is required"),
});

const AppInfoSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  trackId: z.string().min(1, "Track ID is required"),
});

const validateRoute = createApp()
  .post("/package", validator("json", PackageValidationSchema), async c => {
    const { packageName } = c.req.valid("json");

    // TODO: Implement actual package validation logic
    // For now, return mock track data for valid packages

    // Simulate validation - reject packages that don't follow naming convention
    if (!packageName.match(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i)) {
      return c.json(
        {
          message: "Invalid package name format",
          error: "INVALID_FORMAT",
        },
        400,
      );
    }

    // Mock track data - replace with actual database query
    const mockTracks = [
      { id: "1", name: "Alpha Track", description: "Early testing phase" },
      { id: "2", name: "Beta Track", description: "Public beta testing" },
      { id: "3", name: "Production Track", description: "Live version" },
    ];

    return c.json({
      packageName,
      tracks: mockTracks,
      isValid: true,
    });
  })
  .post("/track", validator("json", TrackValidationSchema), async c => {
    const { packageName, trackId } = c.req.valid("json");

    // TODO: Implement actual track validation logic
    // Check if the track has associated groups/emails

    // Mock validation - simulate tracks with and without groups
    // Track ID "2" has no groups, others have groups
    const hasGroups = trackId !== "2";

    if (!hasGroups) {
      return c.json(
        {
          message: "Track has no associated groups",
          error: "NO_GROUPS",
          hasGroups: false,
        },
        200, // Return 200 with hasGroups: false to let client handle the error
      );
    }

    return c.json({
      packageName,
      trackId,
      hasGroups: true,
      isValid: true,
    });
  })
  .post("/app", validator("json", AppInfoSchema), async c => {
    const { packageName, trackId } = c.req.valid("json");

    // TODO: Implement actual app info retrieval from database
    // For now, return mock app data

    // Mock app info data - replace with actual database query
    const mockAppInfo = {
      packageName,
      trackId,
      shortDescription: "혁신적인 모바일 앱으로 일상을 더 편리하게",
      storeImages: [
        "https://picsum.photos/400/400?random=1",
        "https://picsum.photos/400/400?random=2",
      ],
      icon: "https://picsum.photos/200/200?random=3",
      detailedDescription:
        "이 앱은 사용자의 일상을 더욱 편리하게 만들어주는 다양한 기능을 제공합니다. 직관적인 UI/UX로 누구나 쉽게 사용할 수 있으며, 강력한 성능으로 빠른 작업 처리가 가능합니다.",
    };

    return c.json(mockAppInfo);
  });

export default validateRoute;
