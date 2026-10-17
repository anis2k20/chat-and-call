import { ref } from "vue";

type Theme = "light" | "dark";

const saved = localStorage.getItem("theme") as Theme | null;
const theme = ref<Theme>(
  saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
);

function apply() {
  document.documentElement.classList.toggle("dark", theme.value === "dark");
}
apply();

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme.value); // only saved once the user chooses
  apply();
}

export function useTheme() {
  return { theme, toggleTheme };
}