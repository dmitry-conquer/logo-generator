import "../styles/main.scss";
import OpenAI from "openai";

type LogoType = "text" | "icon" | "text-icon";

const LOGO_TYPE_LABELS: Record<LogoType, string> = {
  text: "text only",
  icon: "icon only",
  "text-icon": "text and icon",
};

const buildPrompt = (
  organization: string,
  logoType: LogoType,
  industry: string,
  styles: string[],
  colors: string[],
  references: string,
  referenceNotes: string,
  wishes: string
): string => {
  const preferencesLine = wishes.trim()
    ? `Additional preferences: ${wishes.trim()}.`
    : "No additional preferences.";

  const industryLine = industry.trim()
    ? `Industry: ${industry.trim()}.`
    : "Industry not specified.";

  const styleLine = styles.length
    ? `Style direction: ${styles.join(", ")}.`
    : "No style direction selected.";

  const colorLine = colors.length
    ? `Preferred colors: ${colors.join(", ")}.`
    : "No preferred colors selected.";

  const referenceLine = references.trim()
    ? `Reference links: ${references.trim()}.`
    : "No reference links provided.";

  const referenceNotesLine = referenceNotes.trim()
    ? `Reference notes: ${referenceNotes.trim()}.`
    : "No reference notes provided.";

  return [
    "Create ONLY a logo (no mockups, no background, no 3D scenes).",
    `Organization name: ${organization.trim()}.`,
    `Logo type: ${LOGO_TYPE_LABELS[logoType]}.`,
    industryLine,
    styleLine,
    colorLine,
    referenceLine,
    referenceNotesLine,
    preferencesLine,
    "The result must be just the logo.",
  ].join(" ");
};

const getLogoTypeValue = (value: string): LogoType => {
  if (value === "icon") return "icon";
  if (value === "text-icon") return "text-icon";
  return "text";
};

document.addEventListener("DOMContentLoaded", (): void => {
  const form = document.querySelector<HTMLFormElement>("#logoForm");
  const generateButton = document.querySelector<HTMLButtonElement>("#generateLogo");
  const previewImage = document.querySelector<HTMLImageElement>("#logoPreview");
  const placeholder = document.querySelector<HTMLDivElement>("#logoPlaceholder");
  const statusMessage = document.querySelector<HTMLSpanElement>("#statusMessage");

  if (!form || !generateButton || !previewImage || !placeholder || !statusMessage) {
    return;
  }

  const openai = new OpenAI({
    apiKey: import.meta.env.API_KEY,
    dangerouslyAllowBrowser: true,
  });
  console.log("API_KEY", import.meta.env.API_KEY);

  const setStatus = (message: string) => {
    statusMessage.textContent = message;
  };

  const setLoading = (isLoading: boolean) => {
    generateButton.disabled = isLoading;
    generateButton.textContent = isLoading
      ? "Generating..."
      : "Generate reference logo";
  };

  const renderImage = (dataUrl: string) => {
    previewImage.src = dataUrl;
    previewImage.classList.add("is-visible");
    placeholder.style.display = "none";
  };

  generateButton.addEventListener("click", async () => {
    const formData = new FormData(form);
    const organization = String(formData.get("organization") ?? "").trim();
    const logoType = getLogoTypeValue(String(formData.get("logoType") ?? "text"));
    const industry = String(formData.get("industry") ?? "");
    const references = String(formData.get("references") ?? "");
    const referenceNotes = String(formData.get("referenceNotes") ?? "");
    const wishes = String(formData.get("wishes") ?? "");
    const styles = formData.getAll("style").map(value => String(value));
    const colors = formData.getAll("colors").map(value => String(value));

    if (!organization) {
      setStatus("Please enter the organization name.");
      return;
    }

    setStatus("");
    setLoading(true);

    try {
      const prompt = buildPrompt(
        organization,
        logoType,
        industry,
        styles,
        colors,
        references,
        referenceNotes,
        wishes
      );
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      });

      const imageData = response.data?.[0]?.b64_json;
      const imageUrl = response.data?.[0]?.url;

      if (imageData) {
        renderImage(`data:image/png;base64,${imageData}`);
      } else if (imageUrl) {
        renderImage(imageUrl);
      } else {
        throw new Error("Failed to retrieve the image.");
      }

      setStatus("Logo generated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed.";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    setStatus("Thank you! This form does not submit data yet.");
  });
});
