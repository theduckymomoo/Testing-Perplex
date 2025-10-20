const renderDashboard = () => (
  <ScrollView
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
    }
    showsVerticalScrollIndicator={false}
  >
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.userName}>{getDisplayName()}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {getDisplayName().charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.panicButton} onPress={handlePanic}>
              <Text style={styles.panicText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>

    {/* Energy Status Banner */}
    <View style={styles.energyBanner}>
      <View style={styles.energyBannerContent}>
        <View style={styles.energyStatusIcon}>
          <Text style={styles.energyStatusEmoji}>⚡</Text>
        </View>
        <View style={styles.energyStatusText}>
          <Text style={styles.energyStatusTitle}>
            {stats.totalUsage > 300 ? 'High Usage Alert' : 
             stats.totalUsage > 150 ? 'Normal Usage' : 'Low Usage'}
          </Text>
          <Text style={styles.energyStatusSubtitle}>
            {stats.totalUsage > 300 ? 'Consider turning off some devices' :
             stats.totalUsage > 150 ? 'Your consumption is within normal range' :
             'Great! You\'re saving energy'}
          </Text>
        </View>
        <TouchableOpacity style={styles.energyOptimizeButton} activeOpacity={0.8}>
          <Text style={styles.energyOptimizeText}>Optimize</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Enhanced Quick Stats */}
    <View style={styles.quickStats}>
      <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
        <Text style={styles.statIcon}>⚡</Text>
        <Text style={styles.statValue}>{stats.totalUsage}W</Text>
        <Text style={styles.statLabel}>Current Usage</Text>
        <View style={styles.statTrend}>
          <Text style={[styles.statTrendText, {color: stats.totalUsage > 200 ? '#ef4444' : '#10b981'}]}>
            {stats.totalUsage > 200 ? '↗️ +15%' : '↘️ -8%'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
        <Text style={styles.statIcon}>💰</Text>
        <Text style={styles.statValue}>R{stats.monthlyCost}</Text>
        <Text style={styles.statLabel}>Monthly Cost</Text>
        <View style={styles.statTrend}>
          <Text style={styles.statTrendText}>vs R{Math.round(stats.monthlyCost * 0.9)} last month</Text>
        </View>
      </TouchableOpacity>
    </View>

    {/* Quick Control Panel */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Controls</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickControlsScroll}>
        <TouchableOpacity 
          style={[styles.quickControlCard, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'All Lights Control',
              'Turn all lights on or off?',
              [
                {text: 'Turn Off All', onPress: () => bulkToggleDevices('light', 'off')},
                {text: 'Turn On All', onPress: () => bulkToggleDevices('light', 'on')},
                {text: 'Cancel', style: 'cancel'}
              ]
            );
          }}
        >
          <Text style={styles.quickControlIcon}>💡</Text>
          <Text style={styles.quickControlTitle}>All Lights</Text>
          <Text style={styles.quickControlSubtitle}>
            {appliances.filter(app => app.type === 'light' && app.status === 'on').length} on
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickControlCard, {backgroundColor: 'rgba(59, 130, 246, 0.1)'}]}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Climate Control',
              'Adjust all AC units?',
              [
                {text: 'Turn Off All', onPress: () => bulkToggleDevices('air_conditioner', 'off')},
                {text: 'Eco Mode', onPress: () => Alert.alert('Info', 'Eco mode activated for all AC units')},
                {text: 'Cancel', style: 'cancel'}
              ]
            );
          }}
        >
          <Text style={styles.quickControlIcon}>❄️</Text>
          <Text style={styles.quickControlTitle}>Climate</Text>
          <Text style={styles.quickControlSubtitle}>
            {appliances.filter(app => app.type === 'air_conditioner' && app.status === 'on').length} active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickControlCard, {backgroundColor: 'rgba(168, 85, 247, 0.1)'}]}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Entertainment Mode',
              'Control all entertainment devices?',
              [
                {text: 'Movie Night', onPress: () => Alert.alert('Info', 'Movie night mode activated')},
                {text: 'Turn Off All', onPress: () => bulkToggleDevices('tv', 'off')},
                {text: 'Cancel', style: 'cancel'}
              ]
            );
          }}
        >
          <Text style={styles.quickControlIcon}>📺</Text>
          <Text style={styles.quickControlTitle}>Entertainment</Text>
          <Text style={styles.quickControlSubtitle}>
            {appliances.filter(app => app.type === 'tv' && app.status === 'on').length} on
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickControlCard, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Away Mode',
              'This will turn off all non-essential devices and activate security mode.',
              [
                {text: 'Activate', onPress: () => activateAwayMode()},
                {text: 'Cancel', style: 'cancel'}
              ]
            );
          }}
        >
          <Text style={styles.quickControlIcon}>🏠</Text>
          <Text style={styles.quickControlTitle}>Away Mode</Text>
          <Text style={styles.quickControlSubtitle}>Security mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

    {/* Enhanced Active Devices Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Devices ({stats.activeDevices})</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setActiveTab('controls')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deviceScrollView}>
        {appliances.filter(app => app.status === 'on').map((item) => {
          const energyLevel = getEnergyLevel(item.normal_usage);
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.activeDevice} 
              activeOpacity={0.8}
              onPress={() => toggleAppliance(item.id, item.status)}
            >
              <View style={styles.activeDeviceHeader}>
                <Text style={styles.deviceIcon}>{getApplianceIcon(item.type)}</Text>
                <View style={[styles.statusIndicator, {backgroundColor: energyLevel.color}]} />
              </View>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceRoom}>{item.room}</Text>
              <Text style={styles.deviceUsage}>{item.normal_usage}W</Text>
              <View style={styles.deviceControlButtons}>
                <TouchableOpacity 
                  style={styles.deviceControlButton}
                  onPress={() => toggleAppliance(item.id, item.status)}
                >
                  <Text style={styles.deviceControlButtonText}>Toggle</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        {stats.activeDevices === 0 && (
          <View style={styles.noActiveDevices}>
            <Text style={styles.noActiveText}>No active devices</Text>
            <TouchableOpacity 
              style={styles.addFirstDeviceButton}
              onPress={() => setActiveTab('controls')}
              activeOpacity={0.8}
            >
              <Text style={styles.addFirstDeviceText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>

    {/* Room Overview */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Room Overview</Text>
      <View style={styles.roomOverviewGrid}>
        {getRoomStats().slice(0, 4).map((room, index) => (
          <TouchableOpacity 
            key={room.name} 
            style={styles.roomOverviewCard}
            activeOpacity={0.8}
          >
            <View style={styles.roomOverviewHeader}>
              <Text style={styles.roomOverviewIcon}>🏠</Text>
              <Text style={styles.roomOverviewDeviceCount}>{room.deviceCount}</Text>
            </View>
            <Text style={styles.roomOverviewName}>{room.name}</Text>
            <Text style={styles.roomOverviewUsage}>{room.totalUsage}W</Text>
            <View style={[styles.roomOverviewStatus, 
              {backgroundColor: room.activeDevices > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'}
            ]}>
              <Text style={[styles.roomOverviewStatusText,
                {color: room.activeDevices > 0 ? '#10b981' : '#6b7280'}
              ]}>
                {room.activeDevices > 0 ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Energy Insights */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Energy Insights</Text>
      <View style={styles.insightsContainer}>
        <TouchableOpacity style={styles.insightCard} activeOpacity={0.8}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>📊</Text>
            <Text style={styles.insightTitle}>Peak Hours</Text>
          </View>
          <Text style={styles.insightDescription}>
            Your highest usage is typically between 6-9 PM
          </Text>
          <Text style={styles.insightAction}>View Details →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.insightCard} activeOpacity={0.8}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightTitle}>Smart Tip</Text>
          </View>
          <Text style={styles.insightDescription}>
            Turn off standby devices to save R{Math.round(stats.monthlyCost * 0.12)}/month
          </Text>
          <Text style={styles.insightAction}>Apply Now →</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Enhanced Recent Activity */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity style={styles.clearAllButton} activeOpacity={0.8}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.activityList}>
        {getRecentActivity().map((activity, index) => (
          <TouchableOpacity key={index} style={styles.activityItem} activeOpacity={0.8}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>{activity.icon}</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{activity.action}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <View style={styles.activityImpact}>
              <Text style={[styles.activityImpactText, 
                {color: activity.impact.startsWith('+') ? '#ef4444' : '#10b981'}
              ]}>
                {activity.impact}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Weather-Based Recommendations */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Weather-Based Tips</Text>
      <View style={styles.weatherTipCard}>
        <View style={styles.weatherTipHeader}>
          <Text style={styles.weatherTipIcon}>🌤️</Text>
          <View>
            <Text style={styles.weatherTipTemp}>24°C</Text>
            <Text style={styles.weatherTipDescription}>Sunny • Low humidity</Text>
          </View>
        </View>
        <Text style={styles.weatherTipAction}>
          Perfect weather to turn off AC and open windows. Save up to R{Math.round(stats.monthlyCost * 0.3)} today!
        </Text>
        <TouchableOpacity style={styles.weatherTipButton} activeOpacity={0.8}>
          <Text style={styles.weatherTipButtonText}>Turn Off AC</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
);