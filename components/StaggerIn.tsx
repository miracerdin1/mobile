import React, { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useReducedMotion,
} from "react-native-reanimated";

import { useAppTheme } from "../hooks/useAppTheme";

type StaggerInProps = {
  /** Position in the group; each step adds `theme.motion.stagger` of delay. */
  index?: number;
  /** Extra delay in ms applied on top of the index-based one. */
  delay?: number;
  /** Direction the content travels from. "none" fades without moving. */
  from?: "bottom" | "top" | "none";
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Springs its children into place, offset by `index` so a group of siblings
 * cascades instead of landing all at once. Delays are capped at
 * `motion.staggerMax` steps so long lists never build up a visible lag.
 *
 * Renders a plain View when the OS asks for reduced motion.
 */
export default function StaggerIn({
  index = 0,
  delay = 0,
  from = "bottom",
  style,
  children,
}: StaggerInProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  const { stagger, staggerMax, springEnter } = theme.motion;
  const totalDelay = delay + Math.min(index, staggerMax) * stagger;

  const builder = from === "top" ? FadeInUp : from === "none" ? FadeIn : FadeInDown;
  const entering = builder
    .springify()
    .damping(springEnter.damping)
    .stiffness(springEnter.stiffness)
    .mass(springEnter.mass)
    .delay(totalDelay);

  return (
    <Animated.View style={style} entering={entering}>
      {children}
    </Animated.View>
  );
}
