import { Pressable, Text, StyleSheet } from "react-native";

type ButtonProps = {
    title: string;
    onPress: () => void;
}

export default function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#3b82f6", // Tailwind's bg-blue-500
    width: "100%",
    padding: 12,
    alignItems: "center",
    borderRadius: 12, // Tailwind's rounded-xl
  },
  text: {
    color: "#ffffff", // Tailwind's text-white
    fontWeight: "bold",
  },
});
