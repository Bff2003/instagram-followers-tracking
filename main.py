import os 
import json
from utils import *
import datetime
import shutil

def setup_folder(folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    if not os.path.exists(os.path.join(folder_path, "tracking.json")):
        with open(os.path.join(folder_path, "tracking.json"), "w") as f:
            json.dump({"tracking": []}, f, indent=4)

    if not os.path.exists(os.path.join(folder_path, "script.js")):
        with open(os.path.join(folder_path, "script.js"), "w") as f:
            with open("./templates/script_template.js", "r") as template:
                f.write(template.read().replace("USER_NAME_HERE", folder_path.split("/")[-1].replace("users\\", ""))) 


def get_diff_lists(new_list, old_list, return_same = False, only_usernames = True):    
    new_usernames = {user['username'] for user in new_list}
    old_usernames = {user['username'] for user in old_list}

    novos = [user for user in new_list if user['username'] not in old_usernames]
    removidos = [user for user in old_list if user['username'] not in new_usernames]

    iguais = [user for user in new_list if user in old_list]

    if only_usernames:
        novos = [d['username'] for d in novos]
        removidos = [d['username'] for d in removidos]
        iguais = [d['username'] for d in iguais]

    to_return = {
        'new': novos,
        'removed': removidos,
    }

    if return_same:
        to_return["same"] = iguais

    return to_return

def process_new_file(user_path, in_file_path):
    print(f"Processing file: {in_file_path}")
    data = load_json_file(in_file_path)
    tracking_data = load_json_file(os.path.join(user_path, "tracking.json"))
    now = datetime.datetime.now()

    # exists any file inside the out folder? ./users/user_name/out/
    print(os.listdir(os.path.join(user_path, "out")))
    if len(os.listdir(os.path.join(user_path, "out"))) == 0:
        shutil.copy(in_file_path, os.path.join(user_path, "out", now.strftime("%Y-%m-%dT%H-%M-%S") + ".json"))
    
    # get the most recent in out file
    past_run_file_path = os.path.join(user_path, "out", sorted(os.listdir(os.path.join(user_path, "out")))[-1])
    print(f"Most recent out file: {past_run_file_path}")

    past_run_data = load_json_file(past_run_file_path)

    tracking_data['tracking'].append({
        'last': os.path.basename(past_run_file_path).replace(".json", ""),
        'now': now.strftime("%Y-%m-%dT%H-%M-%S"),
        'followers': get_diff_lists(data['followers'], past_run_data['followers']),
        'unfollowers': get_diff_lists(data['followings'], past_run_data['followings']),
        "mutuals": get_diff_lists(data['mutuals'], past_run_data['mutuals']),
        "dontFollowMeBack": get_diff_lists(data['dontFollowMeBack'], past_run_data['dontFollowMeBack']),
        "iDontFollowBack": get_diff_lists(data['iDontFollowBack'], past_run_data['iDontFollowBack']),
    })

    # invert order of tracking_data['tracking']
    tracking_data['tracking'] = tracking_data['tracking'][::-1]

    # save tracking data
    with open(os.path.join(user_path, "tracking.json"), "w") as f:
        json.dump(tracking_data, f, indent=4)

    # copy the file to the user folder
    shutil.copy(in_file_path, os.path.join(user_path, "out", now.strftime("%Y-%m-%dT%H-%M-%S") + ".json"))
    # os.remove(in_file_path)



if __name__ == "__main__":
    users_folder = os.path.join("./users")

    folders = list_folders(users_folder)
    folders.remove("new_user_template")
    for current_user in folders:
        setup_folder(os.path.join(users_folder, current_user))

        os.makedirs(os.path.join(users_folder, current_user, "out"), exist_ok=True)
        os.makedirs(os.path.join(users_folder, current_user, "in"), exist_ok=True)
        
        # exists any file in the folder? ./users/user_name/in/
        if os.path.exists(os.path.join(users_folder, current_user, "in")):
            for file in os.listdir(os.path.join(users_folder, current_user, "in")):
                if file.endswith(".json"):
                    process_new_file(os.path.join(users_folder, current_user), os.path.join(users_folder, current_user, "in", file))