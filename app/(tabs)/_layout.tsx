import { Colors } from "@/constants/Colors";
import { supabase } from "@/utils/supabase";
import { faExclamation } from "@fortawesome/free-solid-svg-icons/faExclamation";
import { faHouse } from "@fortawesome/free-solid-svg-icons/faHouse";
import { faMap } from "@fortawesome/free-solid-svg-icons/faMap";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Session } from "@supabase/supabase-js";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";

const TabsLayout = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session?.user) {
    // return <Redirect href={"/sign-up"} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.light.primaryColor,
        },
        tabBarActiveTintColor: "lightgreen",
        tabBarInactiveTintColor: "white",
        headerTintColor: "white",
        tabBarStyle: {
          backgroundColor: Colors.light.primaryColor,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          animation: "fade",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesomeIcon icon={faHouse} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          animation: "fade",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesomeIcon icon={faMap} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: "Issues",
          animation: "fade",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesomeIcon icon={faExclamation} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
