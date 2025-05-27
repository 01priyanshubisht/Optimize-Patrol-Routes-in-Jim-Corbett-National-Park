# Wildlife Patrol Application

The Wildlife Patrol app is designed to help park rangers optimize their patrol routes through Jim Corbett National Park using advanced graph algorithms. 

## Features

- Interactive map interface showing patrol stations and routes
- Three algorithm implementations for different patrol strategies:
  - Kruskal's MST for maximum coverage
  - Ford-Fulkerson for resource flow optimization
  - Bellman-Ford for shortest path calculation
- Visualization of calculated routes and statistics
- Responsive design for field use on various devices

## Project Structure

```
wildlife-patrol/
│
├── index.html               # Landing Page
├── dashboard.html           # Map + Algorithm Visualization
├── css/
│   ├── style.css            # Main Styles (wildlife theme)
│   └── dashboard.css        # Dashboard-specific styles
│
├── js/
│   ├── app.js               # Dashboard logic, map + UI
│   ├── graph-algorithms.js  # MST, Max Flow, Bellman-Ford
│   ├── data.js              # Sample station and route data
│   └── landing.js           # Landing page interactions
│
├── assets/
│   ├── images/              # Wildlife icons, logos
│   └── video/
│       └── jungle.mp4       # Background looping video (not included)
│
└── README.md
```

## Usage

1. Open the landing page (`index.html`)
2. Click "Plan Patrol" to access the dashboard
3. Select an algorithm and configure parameters
4. Click "Calculate Route" to visualize the optimized patrol path
5. View route statistics and adjust as needed

## Future Enhancements

- User authentication for ranger-specific routes
- Offline functionality for field use
- Real-time weather and terrain condition integration
- Mobile app conversion using Capacitor or similar framework
