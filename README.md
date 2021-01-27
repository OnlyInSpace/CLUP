# CLUP2.0
CLUP

!IMPORTANT!

IF you want to RUN this project, I will first need the IP address for whichever computer you're using. 
This is required so your app can access the database!
Go to https://whatismyipaddress.com/ to get your IPv4 and email it to one of us!   

Contacts:
- jesalomon1@buffs.wtamu.edu
- mkhan2@buffs.wtamu.edu
- hcwilcox1@buffs.wtamu.edu


________________________________________________________________________________________________________________________________________________________________

STEPS TO RUN PROJECT:

1.  Install NodeJS from https://nodejs.org/en/ for you system
2.  Install git bash from https://gitforwindows.org/ for your system
3.  Download and unzip the code archive and place the project folder somewhere handy
4.  Open the project folder in VSCode. To do this, you can click on File in the top left corner then select the "Open folder..." option and choose the project
    folder.
5.  Open a new terminal by clicking on "Terminal" in the toolbar and selecting "New Terminal"
6.  In your terminal window, click on the dropdown box and click "Select default shell". This will cause another dropdown in the VSCode editor to appear. Click on     
    "Git bash" which should open a new git bash terminal.
7.  Split the terminal 3 times by clicking on the split terminal icon in the top right corner of the terminal window two times. It's right next to the trash can icon. This should split the terminal 3 different times. 
8.  In the first terminal, enter "cd backend" to go to the backend directory.
9.  Then enter the command "npm install" to install package dependencies for the project.
10. Afterward, to start the backend server, enter the command "npm run dev". The backend server will start and the terminal will remain busy/open from now on.
11.  In the second terminal, enter "cd backend" to go to the backend directory.
12. To start the backend authentication server, enter the command "npm run authServer". The backend server will start and the terminal will remain busy/open from now on.
13. While leaving the other two terminals open, switch to the third terminal.
14. In the third terminal, enter "cd frontend" to go to the frontend directory.
15. Enter the command "npm install" to install package dependencies for the project.
16. Enter the command "npm run dev" to start the frontend server. If you have a browser open, then the project will automatically open up a new broswer
    window with the application now visible. If the project does not open automatically, then you can simply type localhost:3000/ in your browser's URL to reach
    it.

________________________________________________________________________________________________________________________________________________________________



Branch Workflow:
- Have a master and develop branch
- When you want to add something new, branch off of the develop branch and create a new branch named "feature/<nameOfFeature"
- Once you finish,  create pull request to the develop branch and have the team review, 
   then merge it in
- Once you have a list of features done in develop that you want to release, create a 
   "release/v0.x" branch, x being the version number
- Pull request to master, once again all guys review
- Then boom merge that bad boy in
- If you make any changes to the release branch make sure you merge that into develop too
