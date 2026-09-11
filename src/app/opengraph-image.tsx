import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Clavis | AI Academic Tutor & Socratic Assistant";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          position: "relative",
          padding: "48px",
          fontFamily: "serif",
        }}
      >
        {/* Subtle radial golden glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(201, 168, 76, 0.14) 0%, rgba(10, 10, 15, 0.9) 65%, #0a0a0f 100%)",
            display: "flex",
          }}
        />

        {/* Outer subtle gold border frame */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
            bottom: "24px",
            border: "1px solid rgba(201, 168, 76, 0.35)",
            borderRadius: "14px",
            display: "flex",
          }}
        />

        {/* Inner delicate gold border frame */}
        <div
          style={{
            position: "absolute",
            top: "34px",
            left: "34px",
            right: "34px",
            bottom: "34px",
            border: "1px solid rgba(201, 168, 76, 0.15)",
            borderRadius: "10px",
            display: "flex",
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            zIndex: 10,
            maxWidth: "980px",
          }}
        >
          {/* Subtle Tag / Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 24px",
              borderRadius: "9999px",
              border: "1px solid rgba(201, 168, 76, 0.4)",
              backgroundColor: "rgba(201, 168, 76, 0.08)",
              color: "#c9a84c",
              fontSize: "14px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            Academic Socratic Intelligence
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: "88px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "#f5f5f7",
              marginBottom: "16px",
              textShadow: "0 0 40px rgba(201, 168, 76, 0.3)",
            }}
          >
            CLAVIS
          </div>

          {/* Gold Decorative Divider with Center Diamond */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "1px",
                backgroundColor: "rgba(201, 168, 76, 0.6)",
              }}
            />
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              style={{ display: "flex" }}
            >
              <polygon points="5,0 10,5 5,10 0,5" fill="#c9a84c" />
            </svg>
            <div
              style={{
                width: "80px",
                height: "1px",
                backgroundColor: "rgba(201, 168, 76, 0.6)",
              }}
            />
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "26px",
              lineHeight: 1.45,
              color: "#c9a84c",
              fontWeight: 400,
              letterSpacing: "0.03em",
              marginBottom: "36px",
              maxWidth: "820px",
            }}
          >
            The Dark Luxury AI Academic Tutor & Socratic Assistant
          </div>

          {/* Capabilities Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              color: "#9ca3af",
              fontSize: "16px",
              letterSpacing: "0.08em",
            }}
          >
            <span>Canvas & Studium LMS</span>
            <span style={{ color: "rgba(201, 168, 76, 0.5)" }}>•</span>
            <span>Deep Slide Analysis</span>
            <span style={{ color: "rgba(201, 168, 76, 0.5)" }}>•</span>
            <span>Structured Socratic Inquiries</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
