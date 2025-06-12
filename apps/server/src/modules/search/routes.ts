import express from "express";
import { db } from "../../../db";
import { courses, users } from "../../../db/schema";
import { or, ilike, eq } from "drizzle-orm";
import * as Sentry from "@sentry/node";

const { logger } = Sentry;

export const searchRoutes = express.Router();

// TOFIX Module 2: Search courses endpoint - expects 'q' parameter but frontend sends 'query'
searchRoutes.get("/search/courses", async (req, res) => {
  try {
    const { q } = req.query;

    await Sentry.startSpan(
      {
        name: "search.courses.server",
        op: "db.search",
        attributes: {
          "search.query": typeof q === "string" ? q : String(q || ""),
        },
      },
      async (span) => {
        logger.info(logger.fmt`Backend received query parameters: ${q}`);

        // Add query validation attributes
        span.setAttributes({
          "search.query_provided": !!q,
        });

        // Realistic API validation - backend expects 'q' parameter
        if (!q || typeof q !== "string") {
          // This will throw when frontend sends 'query' instead of 'q'
          throw new Error(
            `Missing required parameter 'q'. Received parameters: ${Object.keys(
              req.query
            ).join(", ")}`
          );
        }

        logger.info(logger.fmt`Backend searching for: "${q}"`);

        // Simple search implementation
        const results = await db
          .select({
            id: courses.id,
            title: courses.title,
            slug: courses.slug,
            description: courses.description,
            instructor: users.name,
            thumbnail: courses.thumbnail,
            category: courses.category,
            level: courses.level,
            duration: courses.duration,
            price: courses.price,
            rating: courses.rating,
            reviewCount: courses.reviewCount,
          })
          .from(courses)
          .leftJoin(users, eq(courses.instructorId, users.id))
          .where(
            or(
              ilike(courses.title, `%${q}%`),
              ilike(courses.description, `%${q}%`)
            )
          )
          .orderBy(courses.rating)
          .limit(50);

        // Add search results attributes
        span.setAttributes({
          "search.results_count": results.length,
          "search.results_found": results.length > 0,
          "search.query_successful": true,
        });

        logger.info(
          logger.fmt`Backend found ${results.length} results for query: "${q}"`
        );

        const responseData = {
          results,
          total: results.length,
          query: q,
        };

        res.json(responseData);
      }
    );
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: "search.courses.server",
        query: (req.query.q as string) || "undefined",
      },
      extra: {
        queryParameters: req.query,
        searchQuery: req.query.q,
        receivedParameters: Object.keys(req.query),
        requestUrl: req.url,
      },
    });

    logger.error(
      logger.fmt`Search API Error for query "${req.query.q}": ${error.message}`
    );
    throw new Error(error.message);
  }
});
