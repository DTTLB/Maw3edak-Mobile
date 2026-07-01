import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { brand } from '@/constants/brand';

/**
 * Premium bottom-nav icon: when the tab is focused the icon sits inside a
 * soft brand-blue pill. Inactive icons are soft gray. Used by both the patient
 * and doctor tab layouts so the navigation looks identical app-wide.
 */
export function TabBarPillIcon({
  Icon,
  focused,
  color,
}: {
  Icon: LucideIcon;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Icon
        size={22}
        color={focused ? brand.blue : color}
        strokeWidth={focused ? 2.6 : 2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: brand.blueSoft,
  },
});
