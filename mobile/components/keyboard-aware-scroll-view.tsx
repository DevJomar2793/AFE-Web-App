import { useRef } from "react";
import {
  ScrollView,
  type ScrollViewInstance,
  type ScrollViewProps,
} from "react-native";

const inputKeyboardSpacing = 24;

export function KeyboardAwareScrollView({
  onFocusCapture,
  ...props
}: ScrollViewProps) {
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  const handleFocusCapture: NonNullable<ScrollViewProps["onFocusCapture"]> = (
    event,
  ) => {
    onFocusCapture?.(event);
    if (event.target == null) return;

    scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
      event.target,
      inputKeyboardSpacing,
      true,
    );
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onFocusCapture={handleFocusCapture}
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}
