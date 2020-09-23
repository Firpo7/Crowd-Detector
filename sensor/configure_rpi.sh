# install all the dependencies
sudo apt update
sudo apt install bluetooth bluez libbluetooth-dev libudev-dev blueman libbluetooth3

# grant node the necessary privileges to read BLE data
sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))

# start and enables bluetooth services
sudo systemctl start bluetooth
sudo systemctl enable bluetooth
sudo systemctl start hciuart
sudo systemctl enable hciuart

# install the node-modules needed to run the scanner 
npm install

# create|append to .env file (with) some parameters
ENV_FILE=.env

echo 'ID=' >> $ENV_FILE #if the sensor was already registered 

## parameters for registration
echo 'BUILDING=' >> $ENV_FILE
echo 'NAME=' >> $ENV_FILE
echo 'TOKEN=' >> $ENV_FILE
echo 'TYPE=' >> $ENV_FILE
echo 'FLOOR=' >> $ENV_FILE
echo 'MAX_PEOPLE=' >> $ENV_FILE

## main API endpoint
echo 'API=' >> $ENV_FILE 
