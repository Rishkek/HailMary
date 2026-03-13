from flask import Flask, render_template_string
import sqlite3
import folium
import re

app = Flask(__name__)


def generate_map():
    conn = sqlite3.connect('hospitals.db')
    cursor = conn.cursor()
    # Adding 'id' to query to handle specific markers if needed
    cursor.execute("SELECT name, location, Temperature, Rain_mm, Weather, O_pos, A_pos, B_pos, AB_pos FROM hospitals")
    rows = cursor.fetchall()
    conn.close()

    # Using 'CartoDB dark_nolabels' for an even cleaner look
    m = folium.Map(location=[12.9716, 77.5946], zoom_start=12, tiles='cartodbdarkmatter', control_scale=True)

    for row in rows:
        name, location, temp, rain, weather, o_pos, a_pos, b_pos, ab_pos = row

        coords = re.findall(r"[-+]?\d*\.\d+", str(location))
        if len(coords) < 2: continue
        lat, lon = float(coords[0]), float(coords[1])

        # Modern Glassmorphism Popup Design
        html_popup = f"""
        <div style="
            background: rgba(30, 30, 30, 0.9); 
            color: white; 
            padding: 15px; 
            border-radius: 12px; 
            font-family: 'Inter', sans-serif;
            border: 1px solid rgba(255,255,255,0.1);
            width: 220px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        ">
            <div style="color: #ff4d4d; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">{name}</div>
            <div style="margin: 10px 0; font-size: 11px; display: flex; justify-content: space-between;">
                <span>🌡️ {temp}°C</span>
                <span>🌧️ {rain}mm</span>
                <span>☁️ {weather}</span>
            </div>
            <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 10px 0;"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;"><b>O+</b> <span style="float:right; color:#ff4d4d;">{o_pos}</span></div>
                <div style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;"><b>A+</b> <span style="float:right; color:#ff4d4d;">{a_pos}</span></div>
                <div style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;"><b>B+</b> <span style="float:right; color:#ff4d4d;">{b_pos}</span></div>
                <div style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;"><b>AB+</b> <span style="float:right; color:#ff4d4d;">{ab_pos}</span></div>
            </div>
        </div>
        """

        # Using CircleMarker: This doesn't scale with zoom. It stays a small, sharp dot.
        folium.CircleMarker(
            location=[lat, lon],
            radius=6,  # Pixels - stays small regardless of zoom
            popup=folium.Popup(html_popup, max_width=300),
            color="#ff4d4d",  # Red border
            fill=True,
            fill_color="#ff4d4d",
            fill_opacity=0.7,
            weight=2,
            tooltip=name
        ).add_to(m)

    return m._repr_html_()


@app.route('/')
def index():
    map_html = generate_map()
    return render_template_string("""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Medical Logistics | Dashboard</title>
                <style>
                    body { margin: 0; padding: 0; background: #000; }
                    /* Removes the default white Leaflet popup background */
                    .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                    .leaflet-popup-content { margin: 0 !important; }
                    .leaflet-popup-close-button { display: none; }
                </style>
            </head>
            <body>
                {{ map_html|safe }}
            </body>
        </html>
    """, map_html=map_html)


if __name__ == '__main__':
    app.run(debug=True, port=5000)