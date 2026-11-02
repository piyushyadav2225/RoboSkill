
import tkinter as tk
import math

from roboskill import ObstacleAvoidanceSkill


# Create the simulation window
root = tk.Tk()
root.title("ROBOSKILL - Robot Simulator")
root.geometry("800x600")

canvas = tk.Canvas(
    root,
    width=800,
    height=520,
    bg="#202830"
)
canvas.pack()

# Create the robot skill
skill = ObstacleAvoidanceSkill(stop_distance_cm=20)

# Robot starting position
robot_x = 100
robot_y = 260
robot_angle = 0

# Obstacle position
obstacle_x = 550
obstacle_y = 260
obstacle_radius = 30

# Simulation settings
robot_radius = 15
speed = 4
running = True
step_count = 0


def draw_world(distance, action):

    canvas.delete("all")

    # Draw obstacle
    canvas.create_oval(
        obstacle_x - obstacle_radius,
        obstacle_y - obstacle_radius,
        obstacle_x + obstacle_radius,
        obstacle_y + obstacle_radius,
        fill="red",
        outline="white"
    )

    canvas.create_text(
        obstacle_x,
        obstacle_y - 45,
        text="OBSTACLE",
        fill="white",
        font=("Arial", 12, "bold")
    )

    # Draw robot
    canvas.create_oval(
        robot_x - robot_radius,
        robot_y - robot_radius,
        robot_x + robot_radius,
        robot_y + robot_radius,
        fill="#00BFFF",
        outline="white",
        width=2
    )

    # Draw direction indicator
    end_x = robot_x + 30 * math.cos(robot_angle)
    end_y = robot_y + 30 * math.sin(robot_angle)

    canvas.create_line(
        robot_x,
        robot_y,
        end_x,
        end_y,
        fill="yellow",
        width=4
    )

    # Display sensor information
    canvas.create_text(
        400, 30,
        text=f"Distance: {distance:.1f} cm",
        fill="white",
        font=("Arial", 16, "bold")
    )

    canvas.create_text(
        400, 65,
        text=f"Robot action: {action.upper()}",
        fill="lime",
        font=("Arial", 14, "bold")
    )

    canvas.create_text(
        400, 100,
        text=f"Simulation steps: {step_count}",
        fill="white",
        font=("Arial", 12)
    )


def update_robot():

    global robot_x, robot_y
    global robot_angle, step_count

    if not running:
        return

    # Calculate simulated sensor distance
    center_distance = math.sqrt(
        (obstacle_x - robot_x) ** 2 +
        (obstacle_y - robot_y) ** 2
    )

    distance_cm = max(
        0,
        center_distance - obstacle_radius - robot_radius
    )

    # Give simulated sensor data to the actual skill
    result = skill.run(distance_cm)

    action = result["action"]

    # Execute the skill's decision in simulation
    if action == "forward":

        robot_x += speed * math.cos(robot_angle)
        robot_y += speed * math.sin(robot_angle)

    elif action == "turn":

        # Turn 90 degrees and move away
        robot_angle += math.pi / 2

        robot_x += 25 * math.cos(robot_angle)
        robot_y += 25 * math.sin(robot_angle)

    # Keep robot inside the simulation
    robot_x = max(20, min(780, robot_x))
    robot_y = max(20, min(500, robot_y))

    step_count += 1

    draw_world(distance_cm, action)

    root.after(50, update_robot)


def stop_simulation():
    global running
    running = False


# Start simulation
draw_world(0, "starting")

stop_button = tk.Button(
    root,
    text="STOP SIMULATION",
    command=stop_simulation,
    bg="red",
    fg="white"
)

stop_button.pack(pady=10)

root.after(1000, update_robot)

root.mainloop()
