import re

student_data_raw = """
ADAVALLI TANMAYEE
217023026131
Present
Absent
AKIREDDY SPANDANA
217023026002
Present
Absent
ALLE SAI KUMAR
217023026066
Present
Absent
ALWAL BHAVANA
217023026067
Present
Absent
AMIREDDY SUSHMA
217023026132
Present
Absent
ANANTHA PADMANABHA PULIGADDA
217023026113
Present
Absent
ANIVENI RANIKA
217023026001
Present
Absent
ARUKALA SUMANTH
217023026003
Present
Absent
ARUKATLA NIRANJAN REDDY
217023026068
Present
Absent
ASAM ADITHYA SRI CHANDRA CHARY
217023026133
Present
Absent
AVINASH SHARMA
217023026004
Present
Absent
BADAM MOUNIKA DEVI
217023026005
Present
Absent
BANDA AKSHAY KUMAR REDDY
217023026006
Present
Absent
BANDAMEEDI LANKALA LAXMI PRASANNA
217023026134
Present
Absent
BANDARI BHAVANA
217023026072
Present
Absent
BANDARU SRIRENU
217023026137
Present
Absent
BANDELA CHENNA KESAVA REDDY
217023026077
Present
Absent
BANOTH SAHASTRA
217023026008
Present
Absent
BAPURAM JAHNAVI
217023026197
Present
Absent
BARE AKSHAYA
217023026073
Present
Absent
BASIREDDYGARI SAI VARUN REDDY
217023026071
Present
Absent
BATHULA HARRSHA SAI
217023026138
Present
Absent
BATTE SUCHARITHA
217023026007
Present
Absent
BEGUMPET THARUNY
217023026009
Present
Absent
BEJAGAM PRUTHVI RAJ
217023026074
Present
Absent
BHUPATHI DEVESHI
217023026017
Present
Absent
BITLA REYANSH
217023026139
Present
Absent
B NITYA HARSHINI
217023026136
Present
Absent
BODANAPU AKSHAYA
217023026010
Present
Absent
BOLLA DEEPTHI
217023026075
Present
Absent
BOMMANAHAL AKSHAYA
217023026069
Present
Absent
BRAHMADANDI SARASWATHI
217023026070
Present
Absent
B SHIVA PRASAD
217023026135
Present
Absent
BURGULA AKSHITHA
217023026140
Present
Absent
CHALLA SOMESHWAR REDDY
217023026195
Present
Absent
CHANUMOLU TEJASHWINI
217023026012
Present
Absent
CHATRATI VENKATA NITHYASRI
217023026011
Present
Absent
CHINTALA SUNIL KUMAR
217023026142
Present
Absent
CHINTHAKINDI BHAVYA
217023026078
Present
Absent
CHINTHALRA SAHASRA REDDY
217023026076
Present
Absent
CHINTHA SAKETH
217023026013
Present
Absent
CHITTAMPALLY SRUJESHNA
217023026143
Present
Absent
CHOWDOJU UJWALA
217023026141
Present
Absent
DABBAKUTI DEVIKA SRI
217023026198
Present
Absent
DAMPATLA KEERTHANA DEVI
217023026079
Present
Absent
DANUKA SANHITHA
217023026144
Present
Absent
DASARI NIMISHA
217023026081
Present
Absent
DEVERSHETTY THANMYI
217023026145
Present
Absent
DEVINENI NARASIMHA NAIDU
217023026082
Present
Absent
DHARMAPURAM SIDDHARTHA
217023026080
Present
Absent
DIDDI MEGHANA
217023026146
Present
Absent
DOKURU SATHVIK REDDY
217023026015
Present
Absent
DOREPALLI NAVYASRI
217023026200
Present
Absent
D RAHUL KUMAR
217023026016
Present
Absent
DUDEKULA TEJA KALA YOGESWAR
217023026018
Present
Absent
DUMPALA KARTHIKEYA
217023026014
Present
Absent
EGA PREETHI
217023026083
Present
Absent
ENUGULA AMULYA
217023026147
Present
Absent
FIRAS JAMEEL QUADRI
217023026019
Present
Absent
G A CHANDANA
217023026149
Present
Absent
GADAGOJU SAHASRA
217023026150
Present
Absent
GADE SAHASRA
217023026022
Present
Absent
GADE SATHWIKA
217023026087
Present
Absent
GANNU RITHU
217023026151
Present
Absent
GARAPATI HASNA CHOWDARY
217023026084
Present
Absent
GARIMELLA MANISHA
217023026023
Present
Absent
G DIVYA SUNDARI
217023026020
Present
Absent
G HARINI
217023026021
Present
Absent
GOGU SRI HARSHITHA
217023026148
Present
Absent
GONDI ISHITA REDDY
217023026085
Present
Absent
GONELA SREEHARSHA
217023026088
Present
Absent
GOPAGONI KAVYA SRI
217023026152
Present
Absent
GOSHIKA INDRA KARAN KUMAR
217023026201
Present
Absent
GOUTE YAMINI
217023026024
Present
Absent
GUNDU VISHWA TEZ
217023026086
Present
Absent
GUNNA JAGRUTHI
217023026089
Present
Absent
GUTTULA SRAVYA SRI
217023026153
Present
Absent
HABEEBA
217023026090
Present
Absent
HARSHITHA VARA PRIYA KARI
217023026154
Present
Absent
HEBBATAM SHARANYA
217023026025
Present
Absent
INDIRALA ABHINAV
217023026026
Present
Absent
JAGILLAPURAM TARUN KUMAR
217023026091
Present
Absent
JAKKAM POORNIMA
217023026155
Present
Absent
JAKKANI RENUKA
217023026027
Present
Absent
JANUMULA RAJESH
217023026092
Present
Absent
JETTI SAI PAVANI
217023026156
Present
Absent
JINKA DASADHITYA
217023026028
Present
Absent
J VASANT
217023026127
Present
Absent
KADIYALA REVATHI SRI DEEPTHI
217023026029
Present
Absent
KAILA SAIVARDHAN REDDY
217023026095
Present
Absent
KAITHI RAMAKRISHNA REDDY
217023026159
Present
Absent
KANA SAI SARANYA
217023026030
Present
Absent
KANDADI SANJANA REDDY
217023026096
Present
Absent
KANNAM SAI NANDANA
217023026160
Present
Absent
KARNAM SAI GOWTHAM KUMAR
217023026031
Present
Absent
KARRE VIGNESHWAR GOUD
217023026158
Present
Absent
KASAM SETTY JAHNAVI
217023026097
Present
Absent
KASARLA NISHANTH
217023026157
Present
Absent
KASTHURI JAVALI
217023026161
Present
Absent
KATTA SIRI MANOGNA
217023026032
Present
Absent
KESANA VARSHINI
217023026098
Present
Absent
KHANDERAO KARTHIKEYA
217023026162
Present
Absent
K HASINI
217023026093
Present
Absent
KODIPAKA SAIRAJ GOUD
217023026033
Present
Absent
KONDEPATI VARSHITHA
217023026099
Present
Absent
KONGARI AKSHAYA
217023026163
Present
Absent
KOSIREDDY CHIRU TEJA REDDY
217023026094
Present
Absent
KOTHURI SHIVARAMAKRISHNA
217023026034
Present
Absent
KUMITHA ARUN KUMAR REDDY
217023026164
Present
Absent
LAKKAKULA SRIVALLIKA
217023026035
Present
Absent
LAVUDYA JAYA SHREE
217023026194
Present
Absent
MADHA SNEHA
217023026036
Present
Absent
MANASA REDDY VIPPALA
217023026192
Present
Absent
MARAM VIKSHITHA REDDY
217023026101
Present
Absent
MARRIPALLI ANJALI
217023026166
Present
Absent
MD ARSHAAN KHAN
217023026037
Present
Absent
MITTAGADUPULA AKHIL
217023026167
Present
Absent
MOHD KHALEEL ULLAH KHAN ASIM
217023026102
Present
Absent
MOKKA DIVYA
217023026038
Present
Absent
M SAI NIKSHITH GOUD
217023026165
Present
Absent
M SUSHMA
217023026100
Present
Absent
MUDIUM SUMANTH REDDY
217023026103
Present
Absent
MUDRAGANAM BHAVNA YADAV
217023026168
Present
Absent
MUHAMMAD AAQIB UR RAHMON
217023026039
Present
Absent
MUSKU NITHIN
217023026104
Present
Absent
MUTLURI YAKOBU
217023026065
Present
Absent
MYAKALA PRABHAS
217023026169
Present
Absent
MYLABOINA SRI VARSHA
217023026199
Present
Absent
NADIMPALLI SAI ASHISH VARMA
217023026105
Present
Absent
NAGIREDDY NANDITHA
217023026170
Present
Absent
NANDRI ROHITHA
217023026040
Present
Absent
NARNI YASWAN SAI SAMITH
217023026041
Present
Absent
NASHRA FATHIMA
217023026106
Present
Absent
NELAVALLI SRI HARSHINI
217023026171
Present
Absent
NERELLA JASHWAN
217023026042
Present
Absent
NIDHI PATEL
217023026172
Present
Absent
N NIDA MOHAMMADIA
217023026107
Present
Absent
NOAH ALVIN ROOPSON
217023026043
Present
Absent
NOMULA SHRUTHI
217023026108
Present
Absent
OLLAJI HRUSHIK
217023026044
Present
Absent
O VISHNU VARDHINI
217023026173
Present
Absent
PADAVALA VENKATA NAGA AKSHAYA SAI SRI
217023026111
Present
Absent
PAGADALA MADHUSRITHA
217023026176
Present
Absent
PALEPU ROSHAN MANIKANTA KARTHIKEYA
217023026045
Present
Absent
PANUGANTI AJAY KUMAR
217023026047
Present
Absent
PANUGANTI JASWANTH
217023026175
Present
Absent
PATLOLLA VIJENDRA REDDY
217023026112
Present
Absent
PEDDABOINA RAJANANDINI
217023026179
Present
Absent
PERIKETI VAISHNAVI
217023026110
Present
Absent
PERKA SIRI
217023026177
Present
Absent
POLICE HARSHITHA
217023026048
Present
Absent
PONNAM AAKANKSHA
217023026174
Present
Absent
POTHAREDDY RAGHUNANDAN REDDY
217023026046
Present
Absent
RACHARLA ADITHYA
217023026049
Present
Absent
RAGI GAYATHRI
217023026114
Present
Absent
RAMPUR GANAPATHI
217023026050
Present
Absent
RAPAKA SAKETH
217023026115
Present
Absent
RAYYAN YAHYA BIN MAHFOOZ
217023026180
Present
Absent
R NAVIN REDDY
217023026178
Present
Absent
SABAVATH SIDDHU
217023026196
Present
Absent
SADHANA SIDDULA
217023026116
Present
Absent
SAHIL VERMA
217023026181
Present
Absent
SAIVAMSHI RAVIKUMAR SHIVANNAGARI
217023026052
Present
Absent
SAMEEHA YASMIN
217023026117
Present
Absent
SAMUDRALA SRIMAN NARAYANA
217023026182
Present
Absent
SANJAMALA MOUNIKA REDDY
217023026053
Present
Absent
SANUGOMULA HARSHINI REDDY
217023026118
Present
Absent
SARDAR PRABHPREET SINGH
217023026051
Present
Absent
SEELAM VIDHYA SREE
217023026183
Present
Absent
SHAIK HAMMAD
217023026054
Present
Absent
SHAIK RIHAN
217023026119
Present
Absent
SHAIK SAMEERA
217023026184
Present
Absent
SHEIK AHMED ALI
217023026056
Present
Absent
SHEIK MUDASSIR ALI
217023026121
Present
Absent
SIDRAH FATIMA
217023026055
Present
Absent
SIRI MOUKTHIKA MEELA
217023026120
Present
Absent
SIRLA SRIJA
217023026185
Present
Absent
SPOORTHI JADAV
217023026057
Present
Absent
SRAVANI ORUGANTI
217023026109
Present
Absent
SUKKA SUSHMITHA
217023026122
Present
Absent
SWAYAM VYAS
217023026186
Present
Absent
SYED ZAKI AHMED RAZVI
217023026058
Present
Absent
THALLA LAXMI LASYA
217023026123
Present
Absent
THALLAPUREDDY GANESH REDDY
217023026187
Present
Absent
THOUDOJU USHA
217023026059
Present
Absent
THUMALA JAGRUTHI
217023026124
Present
Absent
THUMMAPALA PREETHI ANN
217023026188
Present
Absent
UDAY SHARMA
217023026060
Present
Absent
UPPALA SHASHI KUMAR
217023026125
Present
Absent
VADDE MAHESHWARI
217023026126
Present
Absent
VAKITI SRUTHI
217023026190
Present
Absent
VARAGANTI VINUTHA
217023026062
Present
Absent
VEERAMALLA KAVYA
217023026189
Present
Absent
VEERANDI VARSHINI
217023026191
Present
Absent
VELPUGONDA KEERTHI
217023026063
Present
Absent
VENNAM LAKSHMI SRINIJA
217023026061
Present
Absent
VINAYANJALI CHALAKKAPARAMBIL V
217023026128
Present
Absent
VUDDURU ROHITH
217023026064
Present
Absent
WANGA AMRITHA
217023026129
Present
Absent
YERRAGUNTLA CATHERINE SANHITHA
217023026193
Present
Absent
YUMNA IRFAN
217023026130
Present
Absent
"""

students = []
lines = student_data_raw.strip().split('\n')

i = 0
while i < len(lines):
    name = lines[i].strip()
    i += 1
    hall_ticket = lines[i].strip()
    i += 1
    # Skip "Present" and "Absent" lines
    i += 2 
    students.append({'name': name, 'hall_ticket': hall_ticket})

# Sort the students by hall_ticket
sorted_students = sorted(students, key=lambda x: x['hall_ticket'])

for student in sorted_students:
    print(f"{student['hall_ticket']}")
    print("Present")
    print("Absent")

