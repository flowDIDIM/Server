import { HttpClient } from "@effect/platform";
import { Effect, Either } from "effect";
import { validator } from "hono-openapi";
import { z } from "zod";

import { createGoogleHttpClientUseCase } from "@/domain/use-case/account/create-google-http-client.use-case";
import { getAppInformationUseCase } from "@/domain/use-case/store/get-app-information.use-case";
import { getValidTracksUseCase } from "@/domain/use-case/store/get-valid-tracks-use.case";
import { isValidPackageNameUseCase } from "@/domain/use-case/store/is-valid-package-name.use-case";
import { validateTestTrackUseCase } from "@/domain/use-case/store/validate-test-track.use-case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";

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
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const result = await Effect.gen(function* () {
      yield* isValidPackageNameUseCase(packageName);

      const tracks = yield* getValidTracksUseCase(packageName);
      return {
        isValid: true,
        packageName,
        tracks,
      };
    }).pipe(
      Effect.provideServiceEffect(
        HttpClient.HttpClient,
        createGoogleHttpClientUseCase(user.id),
      ),
      Effect.either,
      runAsApp,
    );

    if (Either.isLeft(result)) {
      const error = result.left;
      return c.json(
        {
          message: "Failed to validate package",
          error: error._tag,
        },
        400,
      );
    }

    return c.json(result.right);
  })
  .post("/track", validator("json", TrackValidationSchema), async c => {
    const { packageName, trackId } = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const result = await Effect.gen(function* () {
      const hasGroups = yield* validateTestTrackUseCase(packageName, trackId);

      return {
        packageName,
        trackId,
        isValid: hasGroups,
      };
    }).pipe(
      Effect.provideServiceEffect(
        HttpClient.HttpClient,
        createGoogleHttpClientUseCase(user.id),
      ),
      Effect.either,
      runAsApp,
    );

    if (Either.isLeft(result)) {
      const error = result.left;
      return c.json(
        {
          message: "Failed to validate track",
          error: error._tag,
        },
        400,
      );
    }

    return c.json(result.right);
  })
  .post("/app", validator("json", AppInfoSchema), async c => {
    const { packageName } = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const result = await Effect.gen(function* () {
      const appInfo = yield* getAppInformationUseCase(packageName);

      return {
        packageName,
        title: appInfo.title,
        shortDescription: appInfo.shortDescription,
        detailedDescription: appInfo.fullDescription,
        icon: appInfo.icon,
        storeImages: appInfo.phoneScreenShots,
      };
    }).pipe(
      Effect.provideServiceEffect(
        HttpClient.HttpClient,
        createGoogleHttpClientUseCase(user.id),
      ),
      Effect.either,
      runAsApp,
    );

    if (Either.isLeft(result)) {
      const error = result.left;
      return c.json(
        {
          message: "Failed to get app information",
          error: error._tag,
        },
        400,
      );
    }

    return c.json(result.right);
  });

export default validateRoute;
