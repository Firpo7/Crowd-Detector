CREATE TABLE IF NOT EXISTS BUILDING(
	name VARCHAR(50) PRIMARY KEY,
	address VARCHAR(100) NOT NULL,
	numFloors INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS SENSOR(
	public_id UUID PRIMARY KEY,
	private_id UUID UNIQUE NOT NULL,
	name VARCHAR(50) NOT NULL,
	floor integer NOT NULL,
	maxPeople integer NOT NULL,
	roomType VARCHAR (50) NOT NULL,
	building VARCHAR(50) NOT NULL,
	FOREIGN KEY (building) REFERENCES BUILDING(name)
);

CREATE TABLE IF NOT EXISTS SENSOR_DATA(
	time TIMESTAMP NOT NULL,
	current_people REAL NOT NULL,
	new_people REAL NOT NULL,
	sensor_id UUID NOT NULL,
	PRIMARY KEY (time, sensor_id),
	FOREIGN KEY (sensor_id) REFERENCES SENSOR(public_id)
);

CREATE TABLE IF NOT EXISTS TOKEN(
	token VARCHAR(25) PRIMARY KEY,
	validity TIMESTAMP NOT NULL
);


INSERT INTO TOKEN VALUES ('AAAAABBBBBCCCCCDDDDDEEEEE', to_timestamp(1891961465));

INSERT INTO BUILDING (name, address, numFloors) VALUES ('DIBRIS-VP', 'via dodecaneso', 8);
INSERT INTO BUILDING (name, address, numFloors) VALUES ('DIBRIS-OP', 'via all''Opera pia', 8);

INSERT INTO SENSOR (public_id, private_id, name, floor, maxPeople, roomType, building) VALUES ('aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f', 'c406218e-12b7-40b6-9b46-9d733c636253', 'ufficio professor KJ', 2, 5, 'office', 'DIBRIS-VP');
INSERT INTO SENSOR (public_id, private_id, name, floor, maxPeople, roomType, building) VALUES ('7181e041-2aa7-4472-a524-4e6a564a6dfc', '411a2f77-4954-40f0-9326-cf020015917e', 'aula-216', 2, 20, 'lecture room', 'DIBRIS-VP');

INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961465), 2, 1, 'aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961345), 1, 0, 'aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961225), 5, 4, 'aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961105), 1, 0, 'aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f');

INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961435), 1, 0, '7181e041-2aa7-4472-a524-4e6a564a6dfc');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961315), 4, 2, '7181e041-2aa7-4472-a524-4e6a564a6dfc');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591961195), 2, 1, '7181e041-2aa7-4472-a524-4e6a564a6dfc');
INSERT INTO SENSOR_DATA (time, current_people, new_people, sensor_id) VALUES (to_timestamp(1591960805), 1, 0, '7181e041-2aa7-4472-a524-4e6a564a6dfc');


-- select the max and avg values of a sensor given a list of public_ids
select sensor_id as id, MAX(current_people) as results from SENSOR_DATA where sensor_id IN ('aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f', '7181e041-2aa7-4472-a524-4e6a564a6dfc') group by sensor_id;
select sensor_id as id, AVG(current_people) as results from SENSOR_DATA where sensor_id IN ('aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f', '7181e041-2aa7-4472-a524-4e6a564a6dfc') group by sensor_id;

-- select the max and avg values of a sensor given a list of public_ids and a time range
select sensor_id as id, MAX(current_people) as results from SENSOR_DATA where sensor_id IN ('aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f', '7181e041-2aa7-4472-a524-4e6a564a6dfc') and time > to_timestamp(1591960906) and time < to_timestamp(1591961316) group by sensor_id;
select sensor_id as id, AVG(current_people) as results from SENSOR_DATA where sensor_id IN ('aedd5f53-d1c4-4faa-a4e5-09bebe9d6f8f', '7181e041-2aa7-4472-a524-4e6a564a6dfc') and time > to_timestamp(1591960906) and time < to_timestamp(1591961316) group by sensor_id;

-- select the max and avg values of sensors given a floor and/or a room type
select sensor_id as id, MAX(current_people) as results from SENSOR_DATA join SENSOR on (sensor_id = public_id) where building = 'DIBRIS-VP' and floor = 2 group by sensor_id;
select sensor_id as id, MAX(current_people) as results from SENSOR_DATA join SENSOR on (sensor_id = public_id) where building = 'DIBRIS-VP' and roomType = 'office' group by sensor_id;

-- select all sensors given a building and a floor
select * from SENSOR where building = 'DIBRIS-VP' and floor = 2;

-- select all sensors given a building and a roomType
select * from SENSOR where building = 'DIBRIS-VP' and roomType = 'office';