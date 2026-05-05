const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(s) {
  return s.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// CATALOGO — se llena con las marcas y modelos
const CATALOG = [
  // ========== TOP MARCAS ==========
  { name: 'Honda', sortOrder: 1, models: [
    'CB 110', 'CB 125F', 'CB 160F', 'CB 190R', 'CB 250 Twister', 'CB 500F', 'CB 500X', 'CB 650R', 'CB 1000R',
    'CBR 150R', 'CBR 250R', 'CBR 500R', 'CBR 600RR', 'CBR 650R', 'CBR 1000RR',
    'CBF 125', 'CBF 150', 'CBF 190', 'CBF 250',
    'CG 125', 'CG 150', 'CG Titan',
    'XR 125L', 'XR 150L', 'XR 190', 'XR 250 Tornado', 'XR 650L',
    'CRF 150L', 'CRF 250L', 'CRF 250R', 'CRF 300L', 'CRF 300 Rally', 'CRF 450R', 'CRF 1000 Africa Twin', 'CRF 1100 Africa Twin',
    'NC 750X', 'NC 750S',
    'Wave 110', 'Wave 125', 'Dio', 'Click 125', 'Click 150', 'PCX 150', 'PCX 160', 'ADV 150', 'ADV 160',
    'Navi 110', 'Biz 125',
    'XBlade 160', 'Hornet 160R', 'Hornet 2.0',
    'Gold Wing', 'Rebel 300', 'Rebel 500', 'Shadow 750',
    'Otro'
  ]},
  { name: 'Yamaha', sortOrder: 2, models: [
    'YBR 125', 'YBR 150', 'YBR Z 125',
    'FZ 150', 'FZ 250', 'FZ 2.0', 'FZ 3.0', 'FZ 25', 'FZ S',
    'MT-03', 'MT-07', 'MT-09', 'MT-10', 'MT-15',
    'R1', 'R3', 'R6', 'R15', 'R25',
    'XTZ 125', 'XTZ 150', 'XTZ 250', 'XTZ 250 Tenere', 'Tenere 700',
    'Fazer 150', 'Fazer 250',
    'Crypton', 'Crypton 110',
    'BWS 125', 'BWS X', 'NMax 155', 'NMax Connected', 'Aerox 155', 'XMax 300',
    'Super Tenere 1200',
    'V-Star 250', 'V-Star 650', 'V-Star 950',
    'Kodiak 450', 'Grizzly', 'Raptor 700', 'Blaster',
    'Otro'
  ]},
  { name: 'Suzuki', sortOrder: 3, models: [
    'AX 100', 'AX 4', 'GN 125', 'GN 125F',
    'GSX-R 150', 'GSX-S 150', 'GSX 250R', 'GSX-R 600', 'GSX-R 750', 'GSX-R 1000',
    'GSX-S 750', 'GSX-S 1000',
    'V-Strom 250', 'V-Strom 650', 'V-Strom 1000', 'V-Strom 1050',
    'Gixxer', 'Gixxer SF 150', 'Gixxer SF 250',
    'DR 200', 'DR 650', 'DR-Z 400',
    'Burgman 125', 'Burgman 200', 'Burgman 400',
    'Hayabusa', 'GSX-8S', 'Katana',
    'Intruder 150', 'Intruder M1800',
    'Address 125',
    'GS 500', 'GS 500F',
    'Otro'
  ]},
  { name: 'Kawasaki', sortOrder: 4, models: [
    'Ninja 250', 'Ninja 300', 'Ninja 400', 'Ninja 650', 'Ninja 1000', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja H2',
    'Z250', 'Z400', 'Z650', 'Z800', 'Z900', 'Z1000',
    'Versys 300', 'Versys 650', 'Versys 1000',
    'KLR 650', 'KLX 150', 'KLX 250', 'KLX 300', 'KLX 450R',
    'KX 85', 'KX 250', 'KX 450',
    'Vulcan S', 'Vulcan 900', 'Vulcan 1700',
    'W800', 'Eliminator',
    'Concours 1400',
    'Otro'
  ]},
  { name: 'KTM', sortOrder: 5, models: [
    'Duke 125', 'Duke 200', 'Duke 250', 'Duke 390', 'Duke 690', 'Duke 790', 'Duke 890', 'Duke 1290 Super Duke R',
    'RC 125', 'RC 200', 'RC 390',
    '250 Adventure', '390 Adventure', '390 Adventure Rally', '690 Adventure', '790 Adventure', '790 Adventure R', '890 Adventure', '890 Adventure R', '1190 Adventure', '1290 Super Adventure', '1290 Super Adventure R',
    '250 EXC', '300 EXC', '350 EXC-F', '450 EXC-F', '500 EXC-F',
    '125 SX', '250 SX', '250 SX-F', '350 SX-F', '450 SX-F',
    '990 Adventure', '990 Adventure R',
    'Otro'
  ]},
  { name: 'Bajaj', sortOrder: 6, models: [
    'Boxer CT 100', 'Boxer BM 100', 'Boxer BM 150',
    'Platina 100 ES', 'Platina 110', 'Platina 125',
    'Discover 125', 'Discover 125 ES', 'Discover 125 ST', 'Discover 150', 'Discover 150F',
    'Pulsar 125', 'Pulsar 135', 'Pulsar 150', 'Pulsar 180', 'Pulsar 200', 'Pulsar NS 125', 'Pulsar NS 160', 'Pulsar NS 200', 'Pulsar NS 400', 'Pulsar RS 200',
    'Dominar 250', 'Dominar 400', 'Dominar D400',
    'Avenger Street 150', 'Avenger Street 220', 'Avenger Cruise 220',
    'Otro'
  ]},
  { name: 'BMW', sortOrder: 7, models: [
    'G 310 R', 'G 310 GS', 'G 450 X', 'G 650 GS', 'G 650 GS Sertao',
    'F 650 GS', 'F 700 GS', 'F 750 GS', 'F 800 GS', 'F 800 GS Adventure', 'F 850 GS', 'F 850 GS Adventure', 'F 900 GS', 'F 900 R', 'F 900 XR',
    'R 1100 GS', 'R 1150 GS', 'R 1150 GS Adventure', 'R 1200 GS', 'R 1200 GS Adventure', 'R 1250 GS', 'R 1250 GS Adventure', 'R 1300 GS',
    'R 1200 R', 'R 1250 R', 'R nineT', 'R 18',
    'S 1000 R', 'S 1000 RR', 'S 1000 XR',
    'K 1600 GT', 'K 1600 GTL',
    'C 400 X', 'C 400 GT', 'C 650 Sport', 'CE 04',
    'HP2', 'HP4',
    'Otro'
  ]},
  { name: 'Royal Enfield', sortOrder: 8, models: [
    'Classic 350', 'Classic 500',
    'Bullet 350', 'Bullet 500',
    'Meteor 350', 'Hunter 350',
    'Himalayan', 'Himalayan 450', 'Scram 411',
    'Interceptor 650', 'Continental GT 650',
    'Super Meteor 650', 'Shotgun 650',
    'Otro'
  ]},
  { name: 'AKT', sortOrder: 10, models: [
    'AK 110', 'AK 125', 'AK 125 SL', 'AK 125 TT', 'AK 125 NKD', 'AK 150', 'AK 150 NKD', 'AK 150 SL', 'AK 150 TT', 'AK 200', 'AK 250',
    'Dynamic 125', 'Dynamic 150', 'Dynamic Pro 125', 'Dynamic Pro 150', 'Dynamic R3 150',
    'Flex 125',
    'NKD 125', 'NKD 150',
    'Special Edition 110', 'Special Edition 125',
    'TTR 180', 'TTR 200',
    'Evo 100', 'Evo 150',
    'Otro'
  ]},
  { name: 'TVS', sortOrder: 11, models: [
    'Apache RTR 160', 'Apache RTR 180', 'Apache RTR 200 4V', 'Apache RR 310', 'Apache RTX 300',
    'Raider 125', 'Ronin 225',
    'Sport 100', 'Star Sport',
    'Neo XR 110', 'Neo XR 125',
    'HLX 125', 'HLX 150',
    'Otro'
  ]},
  { name: 'Bera', sortOrder: 12, models: [
    'BR 150', 'BR 200', 'BR 250',
    'Socialite 150', 'Socialite 200',
    'Robot 200',
    'Matrix 150', 'Matrix 200',
    'Otro'
  ]},
  { name: 'Shineray', sortOrder: 13, models: [
    'XY 125', 'XY 150', 'XY 200', 'XY 250',
    'Phoenix 150', 'Phoenix 200',
    'Super Cub',
    'Thor 200', 'Thor 250',
    'Explorer 150', 'Explorer 200',
    'Otro'
  ]},
  { name: 'Lifan', sortOrder: 14, models: [
    'LF 125', 'LF 150', 'LF 200', 'LF 250',
    'KP 150', 'KP 200', 'KP Mini',
    'KPT 150', 'KPT 200', 'KPT 250',
    'KPR 150', 'KPR 200',
    'Otro'
  ]},
  { name: 'Ducati', sortOrder: 20, models: [
    'Monster 620', 'Monster 696', 'Monster 795', 'Monster 821', 'Monster 937', 'Monster 1100', 'Monster 1200',
    'Panigale 899', 'Panigale 959', 'Panigale V2', 'Panigale 1199', 'Panigale 1299', 'Panigale V4', 'Panigale V4 R', 'Panigale V4 S',
    'Multistrada 950', 'Multistrada 1200', 'Multistrada 1260', 'Multistrada V2', 'Multistrada V4', 'Multistrada V4 Rally',
    'Diavel', 'Diavel 1260', 'Diavel V4', 'XDiavel',
    'Scrambler Icon', 'Scrambler Cafe Racer', 'Scrambler Desert Sled', 'Scrambler 1100',
    'Streetfighter 848', 'Streetfighter V2', 'Streetfighter V4',
    'Hypermotard 796', 'Hypermotard 950',
    'DesertX',
    'Otro'
  ]},
  { name: 'Harley Davidson', sortOrder: 21, models: [
    'Sportster 883', 'Sportster Iron 883', 'Sportster Iron 1200', 'Sportster Forty-Eight', 'Sportster Roadster', 'Sportster S',
    'Softail Standard', 'Softail Deluxe', 'Softail Slim', 'Softail Heritage Classic', 'Softail Fat Boy', 'Softail Breakout', 'Softail Street Bob', 'Softail Low Rider', 'Softail Fat Bob',
    'Dyna Street Bob', 'Dyna Fat Bob', 'Dyna Wide Glide', 'Dyna Low Rider',
    'Touring Road King', 'Touring Street Glide', 'Touring Road Glide', 'Touring Electra Glide', 'Touring Ultra Limited',
    'Street 500', 'Street 750', 'Street Rod',
    'V-Rod Muscle', 'Night Rod',
    'Pan America 1250', 'Pan America Special',
    'LiveWire',
    'Otro'
  ]},
  { name: 'Triumph', sortOrder: 22, models: [
    'Bonneville T100', 'Bonneville T120', 'Bonneville Speedmaster', 'Bonneville Bobber',
    'Street Twin', 'Street Scrambler', 'Scrambler 900', 'Scrambler 1200 XC', 'Scrambler 1200 XE',
    'Speed Triple 1050', 'Speed Triple 1200 RS', 'Speed Twin',
    'Street Triple R', 'Street Triple RS', 'Street Triple 765',
    'Tiger 660 Sport', 'Tiger 800', 'Tiger 800 XC', 'Tiger 800 XR', 'Tiger 850 Sport', 'Tiger 900', 'Tiger 900 GT', 'Tiger 900 Rally', 'Tiger 1200', 'Tiger 1200 GT', 'Tiger 1200 Rally',
    'Rocket 3', 'Rocket 3 R', 'Rocket 3 GT',
    'Daytona 675', 'Daytona Moto2 765',
    'Thruxton 1200', 'Thruxton R', 'Thruxton RS',
    'Otro'
  ]},
  { name: 'Kymco', sortOrder: 23, models: [
    'Agility 125', 'Agility 150', 'Agility 200',
    'Like 125', 'Like 150', 'Like 200',
    'People 125', 'People 150', 'People S 150', 'People S 200',
    'AK 550', 'Xciting 400', 'Xciting 500',
    'Super 8', 'Super 9',
    'Otro'
  ]},
  { name: 'Aprilia', sortOrder: 30, models: [
    'RS 125', 'RS 150', 'RS 250', 'RS 660',
    'RSV4', 'RSV4 Factory', 'RSV4 RR',
    'Tuono 660', 'Tuono V4', 'Tuono V4 Factory',
    'Shiver 750', 'Shiver 900',
    'Dorsoduro 750', 'Dorsoduro 900',
    'Caponord 1200',
    'SR 125', 'SR 150', 'SR 160', 'SR Max', 'SR GT',
    'SXV 450', 'SXV 550',
    'Otro'
  ]},
  { name: 'Benelli', sortOrder: 31, models: [
    'TNT 15', 'TNT 25', 'TNT 135', 'TNT 300', 'TNT 600',
    '302R', '302S',
    'Leoncino 250', 'Leoncino 500', 'Leoncino 800',
    'TRK 251', 'TRK 502', 'TRK 502X', 'TRK 702', 'TRK 702 X', 'TRK 700', 'TRK 700 X',
    '752S', '502C',
    'Imperiale 400',
    'Otro'
  ]},
  { name: 'CF Moto', sortOrder: 32, models: [
    '150 NK', '250 NK', '300 NK', '400 NK', '650 NK', '800 NK',
    '250 SR', '300 SR', '450 SR',
    '300 SS',
    '450 MT', '650 MT', '800 MT', '700 MT', '450 MT Adventure',
    'CLX 700', 'CLX 700 Sport',
    '700 CL-X', '700 CL-X Sport', '700 CL-X Heritage',
    '650 GT', '650 Adventure',
    'Otro'
  ]},
  { name: 'Husqvarna', sortOrder: 33, models: [
    'Svartpilen 125', 'Svartpilen 250', 'Svartpilen 401', 'Svartpilen 701',
    'Vitpilen 125', 'Vitpilen 250', 'Vitpilen 401', 'Vitpilen 701',
    'TE 150', 'TE 250', 'TE 300',
    'FE 250', 'FE 350', 'FE 450', 'FE 501',
    'FC 250', 'FC 350', 'FC 450',
    'TC 85', 'TC 125', 'TC 250',
    'Norden 901',
    'Otro'
  ]},
  { name: 'GasGas', sortOrder: 34, models: [
    'EC 250', 'EC 300', 'EC 350 F', 'EC 450 F',
    'MC 125', 'MC 250', 'MC 250 F', 'MC 450 F',
    'ES 700',
    'SM 700',
    'Otro'
  ]},
  { name: 'Beta', sortOrder: 35, models: [
    'RR 125', 'RR 200', 'RR 250', 'RR 300', 'RR 350', 'RR 390', 'RR 430', 'RR 480',
    'Xtrainer 300',
    'Alp 200', 'Alp 4.0',
    'Motard 50',
    'Otro'
  ]},
  { name: 'MV Agusta', sortOrder: 36, models: [
    'F3 675', 'F3 800', 'F4', 'F4 RR',
    'Brutale 675', 'Brutale 800', 'Brutale 1000 RR',
    'Dragster 800', 'Dragster 800 RR',
    'Turismo Veloce 800',
    'Stradale 800',
    'Otro'
  ]},
  { name: 'Moto Guzzi', sortOrder: 37, models: [
    'V7 Stone', 'V7 Special', 'V7 Racer', 'V7 III',
    'V9 Bobber', 'V9 Roamer',
    'V85 TT',
    'V100 Mandello',
    'California 1400', 'California Touring',
    'Otro'
  ]},
  { name: 'Moto Morini', sortOrder: 38, models: [
    'X-Cape 650', 'X-Cape 1200',
    'Seiemmezzo STR', 'Seiemmezzo SCR',
    'Corsaro ZZ',
    'Otro'
  ]},
  { name: 'Indian', sortOrder: 39, models: [
    'Scout', 'Scout Bobber', 'Scout Sixty',
    'Chief', 'Chief Classic', 'Chief Dark Horse',
    'Chieftain', 'Chieftain Dark Horse',
    'Roadmaster',
    'FTR 1200', 'FTR 1200 S',
    'Otro'
  ]},
  { name: 'Vespa', sortOrder: 40, models: [
    'Primavera 50', 'Primavera 125', 'Primavera 150',
    'Sprint 125', 'Sprint 150',
    'GTS 125', 'GTS 150', 'GTS 300',
    'LX 125', 'LX 150',
    'Elettrica',
    'Otro'
  ]},
  { name: 'Piaggio', sortOrder: 41, models: [
    'Liberty 125', 'Liberty 150',
    'Beverly 300', 'Beverly 400',
    'MP3 300', 'MP3 500',
    'Medley 125', 'Medley 150',
    'Otro'
  ]},
  { name: 'Keeway', sortOrder: 42, models: [
    'Superlight 125', 'Superlight 200',
    'RKS 125', 'RKS 150', 'RKS 200',
    'TX 200',
    'K-Light 202',
    'RK6',
    'Otro'
  ]},
  { name: 'Zontes', sortOrder: 43, models: [
    'ZT 125 U', 'ZT 125 X', 'ZT 125 G1',
    'ZT 155 U', 'ZT 155 G1',
    'ZT 310 R', 'ZT 310 X', 'ZT 310 T', 'ZT 310 M',
    'ZT 350 R', 'ZT 350 T', 'ZT 350 X',
    'Otro'
  ]},
  { name: 'Voge', sortOrder: 44, models: [
    '300 AC', '300 R', '300 RR', '300 DS',
    '500 AC', '500 DS', '500 R',
    '650 DS', '650 DS-X',
    '900 DSX',
    'Otro'
  ]},
  { name: 'Daytona', sortOrder: 45, models: [
    'Daytona 150', 'Daytona 200', 'Daytona 250',
    'Otro'
  ]},
  { name: 'Sukida', sortOrder: 46, models: [
    'Stiff 150', 'Stiff 200',
    'Viper 150',
    'Otro'
  ]},
  { name: 'Thunder', sortOrder: 47, models: [
    'RT 150', 'RT 200',
    'Falcon',
    'TX 150', 'TX 200',
    'Otro'
  ]},
  { name: 'Sonlink', sortOrder: 48, models: [
    'SL 150', 'SL 200', 'SL 200 PANA',
    'Otro'
  ]},
  { name: 'IGM', sortOrder: 49, models: [
    'IGM 125', 'IGM 150', 'IGM 200',
    'Otro'
  ]},
  { name: 'Factory', sortOrder: 50, models: [
    'Factory 125', 'Factory 150', 'Factory 200',
    'Otro'
  ]},
  { name: 'Zongshen', sortOrder: 51, models: [
    'ZS 125', 'ZS 150', 'ZS 200', 'ZS 250',
    'RX3', 'RX4',
    'Otro'
  ]},
  { name: 'Loncin', sortOrder: 52, models: [
    'LX 125', 'LX 150', 'LX 200', 'LX 250',
    'Otro'
  ]},
  { name: 'Polaris', sortOrder: 53, models: [
    'Sportsman 570', 'Sportsman 850',
    'RZR 170', 'RZR 570', 'RZR 900', 'RZR 1000',
    'Ranger', 'Ranger 1000',
    'Otro'
  ]},
  { name: 'Can-Am', sortOrder: 54, models: [
    'Outlander 450', 'Outlander 570', 'Outlander 850', 'Outlander 1000',
    'Maverick Sport', 'Maverick X3',
    'Ryker 600', 'Ryker 900',
    'Spyder F3', 'Spyder RT',
    'Otro'
  ]},
  { name: 'Segway', sortOrder: 55, models: [
    'Villain', 'Warrior',
    'E110', 'E125',
    'Otro'
  ]},
  { name: 'Talaria', sortOrder: 56, models: [
    'Sting', 'Sting R', 'Sting MX4',
    'XXX', 'XXX Pro',
    'Otro'
  ]},
  { name: 'Sunra', sortOrder: 57, models: [
    'Robo-S', 'Robo-S DB',
    'Miku Max', 'Miku Super',
    'Hawk',
    'Otro'
  ]},
  { name: 'Luckeep', sortOrder: 58, models: [
    'X1', 'X3', 'S1',
    'Otro'
  ]},
  { name: 'NIU', sortOrder: 59, models: [
    'N1', 'N1S', 'NQi Sport', 'NQi GT',
    'MQi', 'MQi+',
    'UQi', 'UQi GT',
    'Otro'
  ]},
  { name: 'Super Soco', sortOrder: 60, models: [
    'TS1', 'TC Max', 'TC Wanderer',
    'CPX', 'CUx',
    'Otro'
  ]},
  { name: 'Zero Motorcycles', sortOrder: 61, models: [
    'FX', 'FXE', 'FXS',
    'S', 'SR', 'SR/F', 'SR/S',
    'DS', 'DSR',
    'Otro'
  ]},
  { name: 'Energica', sortOrder: 62, models: [
    'Ego', 'Eva', 'EsseEsse9',
    'Experia',
    'Otro'
  ]},
  { name: 'Italika', sortOrder: 63, models: [
    'FT 110', 'FT 125', 'FT 150', 'FT 150 Sport', 'FT 180', 'FT 200',
    'DS 125', 'DS 150', 'DS 175',
    'RT 180', 'RT 200',
    'XT 110', 'XT 125',
    'Vitalia 125',
    'Vort-X 200', 'Vort-X 300',
    'Otro'
  ]},
  { name: 'Dragon Chopper', sortOrder: 70, models: [
    'Chopper', 'Chopper 250', 'Chopper 300',
    'Otro'
  ]},
  { name: 'Ranger', sortOrder: 71, models: [
    'Ranger 150', 'Ranger 200',
    'Otro'
  ]},
  { name: 'Axxo', sortOrder: 72, models: [
    'Axxo 150', 'Axxo 200',
    'Otro'
  ]},
  { name: 'Gilera', sortOrder: 73, models: [
    'Smash 110', 'Smash VS',
    'SMX 200',
    'Sahel 150',
    'Otro'
  ]},
  { name: 'Motor 1', sortOrder: 74, models: [
    'M1 150', 'M1 200',
    'Otro'
  ]},
  { name: 'Kove', sortOrder: 75, models: [
    '321 R', '321 RR',
    '450 Rally',
    'Otro'
  ]},
  { name: 'Stark', sortOrder: 76, models: [
    'Varg',
    'Otro'
  ]},
  { name: 'Norton', sortOrder: 77, models: [
    'Commando 961',
    'Atlas 650',
    'V4 SV',
    'Otro'
  ]},
  { name: 'Horwin', sortOrder: 78, models: [
    'CR6', 'CR6 Pro',
    'EK1', 'EK3',
    'SK3',
    'Otro'
  ]},
  { name: 'Vmoto', sortOrder: 79, models: [
    'CUx', 'TS', 'CPX',
    'Otro'
  ]},
  { name: 'Z1', sortOrder: 80, models: [
    'Tourism 250', 'Tourism Pro 250',
    'AK 200',
    'Super 150', 'Super 175',
    'Cobra 250',
    'CBR250 Storm',
    'Otro'
  ]},
  { name: 'Otra', sortOrder: 9999, models: [
    'Otra'
  ]},
]


async function main() {
  console.log('Iniciando seed de catalogo de motos...')
  let brandsCreated = 0, modelsCreated = 0, brandsSkipped = 0

  for (const brand of CATALOG) {
    const brandSlug = slugify(brand.name)
    const existing = await prisma.motoBrand.findUnique({ where: { slug: brandSlug } })

    if (existing) {
      brandsSkipped++
      // Agregar modelos nuevos a marca existente
      for (const modelName of brand.models) {
        const exists = await prisma.motoModel.findFirst({
          where: { brandId: existing.id, name: modelName }
        })
        if (!exists) {
          await prisma.motoModel.create({
            data: {
              brandId: existing.id,
              name: modelName,
              slug: slugify(modelName),
            }
          })
          modelsCreated++
        }
      }
      continue
    }

    const created = await prisma.motoBrand.create({
      data: {
        name: brand.name,
        slug: brandSlug,
        sortOrder: brand.sortOrder || 100,
        models: {
          create: brand.models.map(m => ({
            name: m,
            slug: slugify(m),
          }))
        }
      }
    })
    brandsCreated++
    modelsCreated += brand.models.length
    console.log(`  + ${brand.name} (${brand.models.length} modelos)`)
  }

  console.log('\n=== Resumen ===')
  console.log(`Marcas nuevas: ${brandsCreated}`)
  console.log(`Marcas ya existentes (omitidas): ${brandsSkipped}`)
  console.log(`Modelos creados: ${modelsCreated}`)
  const totalBrands = await prisma.motoBrand.count()
  const totalModels = await prisma.motoModel.count()
  console.log(`Total en DB: ${totalBrands} marcas, ${totalModels} modelos`)
}

main()
  .catch(e => { console.error('ERROR:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
