
import { Redirect } from "expo-router";

export default function Index() {
  console.log('Index screen - redirecting to home');
  return <Redirect href="/(tabs)/(home)" />;
}
