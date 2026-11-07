export const Platform = {
  OS: "ios",
  select: (obj: any) => obj.ios || obj.default,
};

export const View = "View";
export const Text = "Text";
export const StyleSheet = {
  create: (styles: any) => styles,
};
export const Pressable = "Pressable";
export const TextInput = "TextInput";
export const Alert = {
  alert: () => {},
};
