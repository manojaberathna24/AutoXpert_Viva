import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../layout';

export default function Assessment_page() {
  const params = useLocalSearchParams();
  const { predicted_tire_depth_mm, tire_condition } = params;

  const formattedTireDepth = parseFloat(
    Array.isArray(predicted_tire_depth_mm) ? predicted_tire_depth_mm[0] : (predicted_tire_depth_mm as string) || "0"
  ).toFixed(2);

  const tireCondition = (Array.isArray(tire_condition) ? tire_condition[0] : tire_condition as string) || "middle";

  const getRunningMileage = (condition: string) => {
    const mileageMap: any = {
      low: 10000,
      middle: 30000,
      good: 50000,
      'very good': 60000,
    };
    return mileageMap[condition.toLowerCase()] || 30000;
  };

  const runningMileage = getRunningMileage(tireCondition);
  const remainingLifePercent = Math.round((runningMileage / 60000) * 100);

  const getStatusConfig = (condition: string) => {
    const configs: any = {
      low: {
        color: '#EF4444', 
        bgColor: '#FEF2F2',
        icon: 'warning',
        title: 'Danger: Immediate Replacement',
        message: 'Your tire is severely worn out. It is unsafe to drive. Replace immediately.',
      },
      middle: {
        color: '#F59E0B', 
        bgColor: '#FFFBEB',
        icon: 'warning',
        title: 'Caution: Wear Detected',
        message: 'Your tire is showing significant wear. Plan for replacement within 5,000 km.',
      },
      good: {
        color: '#10B981', 
        bgColor: '#ECFDF5',
        icon: 'checkmark-circle',
        title: 'Good Condition',
        message: 'Your tire is in good condition. Keep monitoring it regularly.',
      },
      'very good': {
        color: '#3B82F6', 
        bgColor: '#EFF6FF',
        icon: 'shield-checkmark',
        title: 'Excellent Condition',
        message: 'Your tire is practically new and in perfect running condition.',
      },
    };
    return configs[condition.toLowerCase()] || configs['middle'];
  };

  const statusConfig = getStatusConfig(tireCondition);

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.header}>Assessment Result</Text>

          {/* Remaining Life Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Remaining Life</Text>
              <Text style={[styles.progressPercent, { color: statusConfig.color }]}>{remainingLifePercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${remainingLifePercent}%`, backgroundColor: statusConfig.color }]} />
            </View>
          </View>

          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: statusConfig.color }]}>
            <Ionicons name={statusConfig.icon as any} size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.badgeText}>{tireCondition.toUpperCase()}</Text>
          </View>

          {/* Metric Boxes */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Tread Depth</Text>
              <Text style={styles.metricValue}>{formattedTireDepth}<Text style={styles.metricUnit}>mm</Text></Text>
            </View>
            <View style={styles.metricBoxRight}>
              <Text style={styles.metricLabel}>Est. Mileage</Text>
              <Text style={styles.metricValue}>{runningMileage / 1000}k<Text style={styles.metricUnit}>km</Text></Text>
            </View>
          </View>

          {/* Caution Message */}
          <View style={[styles.cautionBox, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.cautionTitle, { color: statusConfig.color }]}>{statusConfig.title}</Text>
            <Text style={styles.cautionMessage}>{statusConfig.message}</Text>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
            <Text style={styles.infoText}>
              Predictions are based on AI analysis and should be verified with a physical gauge.
            </Text>
          </View>

        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F3F4F6',
  },
  card: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 30,
    color: '#1E293B',
  },
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    width: '100%',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 30,
    overflow: 'hidden',
  },
  metricBox: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBoxRight: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cautionBox: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  cautionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  cautionMessage: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
