import { SimpleTabBar } from "@/components/SimpleTabBar";
import { supabase } from "@/utils/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { faMap } from "@fortawesome/free-solid-svg-icons/faMap";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons/faTriangleExclamation";
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
      tabBar={(props) => <SimpleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#168676",
        },
        tabBarActiveTintColor: "#4DFFCD",
        tabBarInactiveTintColor: "white",
        headerTintColor: "white",
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

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          animation: "fade",
          headerTitleAlign: "left",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome name="user-circle-o" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
