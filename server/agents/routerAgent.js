function routerAgent(question) {
  const q = question.toLowerCase();

  if (
    q.includes("rain") ||
    q.includes("weather") ||
    q.includes("temperature") ||
    q.includes("irrigate") ||   // ⭐ IMPORTANT
    q.includes("irrigation") ||
    q.includes("humidity")
  ) {
    return "weather";
  }

  if (q.includes("soil") || q.includes("ph")) {
    return "soil";
  }

  if (
    q.includes("fertilizer") ||
    q.includes("urea") ||
    q.includes("dap") ||
    q.includes("npk")
  ) {
    return "fertilizer";
  }

  if (
    q.includes("disease") ||
    q.includes("leaf") ||
    q.includes("spots") ||
    q.includes("yellow")
  ) {
    return "disease";
  }

  return "general";
}

module.exports = routerAgent;