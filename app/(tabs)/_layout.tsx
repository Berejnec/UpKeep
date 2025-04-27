import { Colors } from "@/constants/Colors";
import { supabase } from "@/utils/supabase";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons/faTriangleExclamation";
import { faMap } from "@fortawesome/free-solid-svg-icons/faMap";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Session } from "@supabase/supabase-js";
import { Tabs } from "expo-router";
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
          backgroundColor: "#168676",
        },
        tabBarActiveTintColor: "#4DFFCD",
        tabBarInactiveTintColor: "white",
        headerTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#168676",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="issues"
        options={{
          title: "Issues",
          animation: "fade",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              size={28}
              color={color}
            />
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
    </Tabs>
  );
};

export default TabsLayout;
