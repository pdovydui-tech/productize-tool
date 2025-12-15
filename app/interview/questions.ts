export type Question = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
};

export const QUESTIONS: Question[] = [
  { key: "service", label: "What marketing service do you mainly sell?", type: "select", options: ["Ads", "SEO", "Social media", "Email marketing", "Other"] },
  { key: "ideal_client", label: "Who is your ideal client? (e.g. SaaS, ecommerce, local)", type: "text" },
  { key: "main_problem", label: "What problem do clients usually come to you with?", type: "text" },
  { key: "first_step", label: "What is the FIRST thing you do with a new client?", type: "text" },
  { key: "most_important_step", label: "What is the MOST important step in your process?", type: "text" },
  { key: "common_mistakes", label: "What mistakes do clients usually make before working with you?", type: "text" },
  { key: "differentiator", label: "What do you do differently from others in your niche?", type: "text" },
  { key: "expected_result", label: "What result do clients expect after working with you?", type: "text" },
  { key: "most_valued", label: "What part of your work do clients value the most?", type: "text" },
  { key: "frequent_questions", label: "What do clients often ask you to explain?", type: "text" },
  { key: "format", label: "Which format feels easiest to productize?", type: "select", options: ["Checklist", "Playbook", "SOP", "Guide"] },
  { key: "buyer", label: "Who would buy this product?", type: "text" },
  { key: "no_brainer", label: "What would make this a no-brainer purchase?", type: "text" },
  { key: "audience_level", label: "Audience level?", type: "select", options: ["Beginner", "Intermediate"] },
  { key: "time_saved", label: "How much time should this product save them?", type: "text" },
];
