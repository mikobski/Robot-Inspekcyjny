export const ROS_CONFIG = {
  defaultTopics: {
    camera: "/d400/color/image_raw/compressed",
    lidar: "/scan_lidar",
    manualControl: "/critbot/manual_control",
    modeSelect: "/critbot/mode_changes",
    statusBattery: "/mavros/battery",
    statusWifi: "/wifi_status",
    statusGps: "mavros/global_position/global",
    mapOdom: "/odometry/filtered",
    mapNavSat: "/navsat/fix",
    measPlot: "/odometry/filtered",
    mapSetWaypoints: "/set_waypoints"
  },
  defaultURL: "ws://localhost:9090"
  //defaultURL: "ws://10.42.0.1:9090"
  //defaultURL: "ws://rosnuc:9090"
};