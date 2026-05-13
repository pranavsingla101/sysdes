import type { CanvasNode, CanvasEdge, NodeColor, NodeShape } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function n(
  id: string,
  label: string,
  shape: NodeShape,
  x: number,
  y: number,
  fill: NodeColor["fill"],
  width: number,
  height: number
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: { label, color: fill, shape },
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return { id, source, target, type: "canvasEdge", data: label ? { label } : {} };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
  nodes: [
    n("client",   "Client",          "pill",      0,   175, "#1F1F1F", 120,  52),
    n("gateway",  "API Gateway",     "rectangle", 160, 165, "#10233D", 110,  62),
    n("auth",     "Auth Service",    "hexagon",   325,  60, "#2E1938", 100,  82),
    n("users",    "User Service",    "rectangle", 325, 162, "#0F2E18", 110,  62),
    n("orders",   "Order Service",   "rectangle", 325, 274, "#331B00", 110,  62),
    n("products", "Product Service", "rectangle", 325, 386, "#062822", 110,  62),
    n("user-db",  "User DB",         "cylinder",  480, 162, "#10233D",  96,  80),
    n("order-db", "Order DB",        "cylinder",  480, 274, "#10233D",  96,  80),
    n("queue",    "Message Queue",   "cylinder",  480, 386, "#3C1618",  96,  80),
    n("notify",   "Notifications",   "rectangle", 630, 386, "#3A1726", 110,  62),
  ],
  edges: [
    e("e1", "client",  "gateway"),
    e("e2", "gateway", "auth"),
    e("e3", "gateway", "users"),
    e("e4", "gateway", "orders"),
    e("e5", "gateway", "products"),
    e("e6", "users",   "user-db"),
    e("e7", "orders",  "order-db"),
    e("e8", "orders",  "queue"),
    e("e9", "queue",   "notify"),
  ],
};

const cicd: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
  nodes: [
    n("repo",       "Source Repo",       "cylinder",   0,  30, "#10233D",  96,  80),
    n("build",      "Build",             "rectangle", 130,  30, "#0F2E18", 100,  60),
    n("test",       "Unit Tests",        "rectangle", 260,  30, "#0F2E18", 100,  60),
    n("scan",       "Security Scan",     "hexagon",   390,  19, "#3C1618", 100,  82),
    n("registry",   "Artifact Registry", "cylinder",  524,  30, "#10233D",  96,  80),
    n("staging",    "Deploy Staging",    "rectangle", 660, -10, "#331B00", 100,  60),
    n("e2e",        "E2E Tests",         "rectangle", 660,  80, "#0F2E18", 100,  60),
    n("production", "Deploy Production", "rectangle", 800,  30, "#0F2E18", 100,  60),
    n("monitor",    "Monitoring",        "rectangle", 940,  30, "#062822", 100,  60),
  ],
  edges: [
    e("e1", "repo",       "build"),
    e("e2", "build",      "test"),
    e("e3", "test",       "scan"),
    e("e4", "scan",       "registry"),
    e("e5", "registry",   "staging"),
    e("e6", "registry",   "e2e"),
    e("e7", "staging",    "production"),
    e("e8", "e2e",        "production"),
    e("e9", "production", "monitor"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
  nodes: [
    n("web-app",     "Web App",        "rectangle",   0,   0, "#10233D", 110,  62),
    n("mobile",      "Mobile App",     "pill",        0, 105, "#10233D", 120,  52),
    n("backend",     "Backend API",    "rectangle",   0, 215, "#10233D", 110,  62),
    n("event-bus",   "Event Bus",      "hexagon",   200, 100, "#2E1938", 110,  90),
    n("router",      "Event Router",   "diamond",   375,  90, "#331B00", 100, 100),
    n("analytics",   "Analytics",      "rectangle", 540,   0, "#062822", 110,  62),
    n("email",       "Email Service",  "rectangle", 540, 105, "#3A1726", 110,  62),
    n("inventory",   "Inventory",      "rectangle", 540, 210, "#0F2E18", 110,  62),
    n("event-store", "Event Store",    "cylinder",  200, 270, "#10233D",  96,  80),
    n("dlq",         "Dead Letter Q",  "cylinder",  540, 330, "#3C1618",  96,  80),
  ],
  edges: [
    e("e1", "web-app",   "event-bus"),
    e("e2", "mobile",    "event-bus"),
    e("e3", "backend",   "event-bus"),
    e("e4", "event-bus", "router"),
    e("e5", "event-bus", "event-store"),
    e("e6", "router",    "analytics"),
    e("e7", "router",    "email"),
    e("e8", "router",    "inventory"),
    e("e9", "router",    "dlq"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [microservices, cicd, eventDriven];
