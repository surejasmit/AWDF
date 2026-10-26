const aiService = require("../services/aiService");

/**
 * Analyze and enhance a task with AI
 * POST /api/ai/suggest or POST /tasks/ai-suggest
 */
const analyzeTask = async (req, res, next) => {
  try {
    const title = req.body.title || req.body.text || "";
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required to generate AI suggestions.",
      });
    }

    // Call AI Service (handles Groq/Gemini calls with timeout & automatic fallback)
    const analysis = await aiService.enhanceTask(title);

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    // Graceful error handling: core application must continue to function normally
    console.warn("AI Controller warning:", error.message);
    const fallback = aiService.generateFallbackAnalysis(req.body.title || "New Task");
    return res.status(200).json({
      success: true,
      data: fallback,
      warning: "AI service degraded; fallback analysis applied.",
    });
  }
};

module.exports = {
  analyzeTask,
};
